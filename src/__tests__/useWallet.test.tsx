import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { STORE_KEYS } from '../state/keyring';
import { useWallet } from '../useWallet';
import { ABOUT, makeDeps, PIN } from './helpers';

type Deps = Awaited<ReturnType<typeof makeDeps>>;
type W = ReturnType<typeof useWallet>;

async function setup(opts: { wallet?: boolean } = {}) {
  const env = await makeDeps(opts);
  const hook = await renderHook(() => useWallet(env.deps));
  await waitFor(() => expect(hook.result.current.screen).not.toBe('boot'));
  return { ...env, hook };
}
type Env = Deps & { hook: Awaited<ReturnType<typeof renderHook<W, unknown>>> };

async function press(env: Env, fn: (w: W) => unknown) {
  await act(async () => void (await fn(env.hook.result.current)));
}
/** Types a PIN on the PIN screen (or signing sheet) and waits until the check has finished. */
async function typePin(env: Env, digits: string, keys: 'pinKeys' | 'confirmKeys' = 'pinKeys') {
  for (const d of digits) await press(env, (w) => w[keys].find((k) => k.label === d)!.onClick());
  await act(async () => new Promise((r) => setTimeout(r, 200)));
  await waitFor(() => expect(env.hook.result.current.pinDots.every((d) => d === '#2A2A32') || env.hook.result.current.screen !== 'pin').toBe(true));
}
const w = (env: Env) => env.hook.result.current;

/** Unlocked app with the "abandon … about" wallet. */
async function unlocked() {
  const env = (await setup({ wallet: true })) as Env;
  await typePin(env, PIN);
  await waitFor(() => expect(w(env).screen).toBe('home'));
  return env;
}

describe('start', () => {
  it('shows onboarding without a wallet', async () => {
    const env = (await setup()) as Env;
    expect(w(env).screen).toBe('welcome');
  });

  it('shows the locked PIN screen when a wallet exists', async () => {
    const env = (await setup({ wallet: true })) as Env;
    expect(w(env).screen).toBe('pin');
    expect(w(env).pinTitle).toBe('Anthea ist gesperrt');
    expect(w(env).pinCanBack).toBe(false);
  });
});

describe('create', () => {
  it('generates a real phrase, checks 3 random words and stores the vault', async () => {
    const env = (await setup()) as Env;
    await press(env, (x) => x.startCreate());
    for (const i of [0, 1, 2]) await press(env, (x) => x.warnRows[i]!.onClick());
    await press(env, (x) => x.warnNext());
    const words = w(env).seedWords.map((s) => s.w);
    expect(words).toHaveLength(12);
    expect(new Set(words).size).toBeGreaterThan(1);

    await press(env, (x) => x.revealSeed());
    await press(env, (x) => x.seedNext());
    const rows = w(env).verifyRows;
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.pos)).toEqual([...rows.map((r) => r.pos)].sort((a, b) => a - b));
    for (const row of rows) {
      expect(row.opts.filter((o) => o.w === words[row.pos - 1])).toHaveLength(1);
      await press(env, (x) =>
        x.verifyRows
          .find((r) => r.pos === row.pos)!
          .opts.find((o) => o.w === words[row.pos - 1])!
          .onClick(),
      );
    }
    await press(env, (x) => x.verifyNext());
    expect(w(env).pinTitle).toBe('PIN festlegen');

    await typePin(env, '135790');
    expect(w(env).pinTitle).toBe('PIN bestätigen');
    await typePin(env, '135790');
    await waitFor(() => expect(w(env).screen).toBe('home'));
    expect(w(env).toast).toBe('Wallet bereit');
    expect(await env.keyring.hasWallet()).toBe(true);
    expect((await env.keyring.revealPhrase('135790')).join(' ')).toBe(words.join(' '));
    expect(w(env).seedWords).toEqual([]); // phrase dropped from memory after onboarding
  });

  it('draws new positions and wrong words for each new wallet', async () => {
    const env = (await setup()) as Env;
    const seen = new Set<string>();
    for (let k = 0; k < 5; k++) {
      await press(env, (x) => x.startCreate());
      seen.add(JSON.stringify(w(env).verifyRows.map((r) => [r.pos, r.opts.map((o) => o.w)])));
    }
    expect(seen.size).toBe(5);
  });

  it('restarts PIN setup when the confirmation differs', async () => {
    const env = (await setup()) as Env;
    await press(env, (x) => x.startImport());
    await press(env, (x) => x.onImport(ABOUT));
    await press(env, (x) => x.importNext());
    await typePin(env, '111111');
    await typePin(env, '222222');
    expect(w(env).pinTitle).toBe('PIN festlegen');
    expect(w(env).pinError).toBe('PINs stimmen nicht überein. Bitte neu festlegen.');
  });
});

describe('import', () => {
  it.each([
    ['', '0 / 12 Wörter', false],
    ['abandon abandon ', '2 / 12 Wörter', false],
    ['abandon xyz ', '„xyz“ ist kein gültiges BIP39-Wort', false],
    [ABOUT.replace(/about$/, 'abandon'), 'Prüfsumme ungültig. Prüfe Reihenfolge und Schreibweise.', false],
    [ABOUT, 'Prüfsumme gültig', true],
    [ABOUT + ' abandon', '13 / 24 Wörter', false],
  ])('"%s" → %s', async (text, msg, valid) => {
    const env = (await setup()) as Env;
    await press(env, (x) => x.startImport());
    await press(env, (x) => x.onImport(text));
    expect(w(env).importMsg).toBe(msg);
    expect(w(env).importValid).toBe(valid);
  });

  it('suggests words from the full BIP39 list', async () => {
    const env = (await setup()) as Env;
    await press(env, (x) => x.startImport());
    await press(env, (x) => x.onImport('abandon zo'));
    expect(w(env).importSugg.map((s) => s.w)).toEqual(['zone', 'zoo']);
    await press(env, (x) => x.importSugg[1]!.onClick());
    expect(w(env).importText).toBe('abandon zoo ');
  });

  it('derives the same addresses as the reference vectors and scans Bitcoin', async () => {
    const env = (await setup()) as Env;
    await press(env, (x) => x.startImport());
    await press(env, (x) => x.onImport(ABOUT));
    await press(env, (x) => x.importNext());
    await typePin(env, PIN);
    await typePin(env, PIN);
    await waitFor(() => expect(w(env).screen).toBe('home'));
    expect(w(env).toast).toBe('Konten abgeleitet · Bitcoin-Scan abgeschlossen');
    // 20 unused receive + 20 unused change addresses checked (gap limit).
    expect(env.deps.isBtcAddressUsed).toHaveBeenCalledTimes(40);
    await press(env, (x) => x.actions[1]!.onClick()); // Empfangen
    expect(w(env).rcvAddr.replace(/ /g, '')).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
    expect(w(env).qr.size).toBeGreaterThan(20);
  });

  it('continues without the Bitcoin scan when offline', async () => {
    const env = (await setup()) as Env;
    (env.deps.isBtcAddressUsed as jest.Mock).mockRejectedValue(new Error('offline'));
    await press(env, (x) => x.startImport());
    await press(env, (x) => x.onImport(ABOUT));
    await press(env, (x) => x.importNext());
    await typePin(env, PIN);
    await typePin(env, PIN);
    await waitFor(() => expect(w(env).screen).toBe('home'));
    expect(w(env).toast).toBe('Konten abgeleitet · Bitcoin-Scan fehlgeschlagen');
  });
});

describe('PIN attempts (BUILD_PLAN 5.3)', () => {
  it('counts down the remaining attempts, then blocks entry with a timer', async () => {
    const env = (await setup({ wallet: true })) as Env;
    for (const left of [4, 3, 2, 1]) {
      await typePin(env, '000000');
      expect(w(env).pinError).toBe(left === 1 ? 'Falsche PIN. Noch 1 Versuch.' : `Falsche PIN. Noch ${left} Versuche.`);
    }
    await typePin(env, '000000');
    expect(w(env).pinError).toBe('Zu viele Versuche. Erneut möglich in 01:00');
    expect(w(env).pinLocked).toBe(true);

    // Keypad ignores input while blocked.
    await press(env, (x) => x.pinKeys.find((k) => k.label === '1')!.onClick());
    expect(w(env).pinDots.every((d) => d === '#2A2A32')).toBe(true);

    // The wait survives a restart (counter in secure storage).
    const restarted = await renderHook(() => useWallet(env.deps));
    await waitFor(() => expect(restarted.result.current.screen).toBe('pin'));
    expect(restarted.result.current.pinError).toBe('Zu viele Versuche. Erneut möglich in 01:00');
  });

  it('never deletes the wallet and resets the counter after the right PIN', async () => {
    const env = (await setup({ wallet: true })) as Env;
    await env.store.set(STORE_KEYS.pinAttempts, JSON.stringify({ failures: 9, lockedUntil: 0 }));
    await typePin(env, PIN);
    await waitFor(() => expect(w(env).screen).toBe('home'));
    expect(await env.store.get(STORE_KEYS.pinAttempts)).toBe(JSON.stringify({ failures: 0, lockedUntil: 0 }));
    expect(await env.keyring.hasWallet()).toBe(true);
  });
});

describe('lock', () => {
  it('locks on demand and drops the public data', async () => {
    const env = await unlocked();
    await press(env, (x) => x.lockNow());
    expect(w(env).screen).toBe('pin');
    expect(w(env).pinTitle).toBe('Anthea ist gesperrt');
    await typePin(env, PIN);
    await waitFor(() => expect(w(env).screen).toBe('home'));
  });

  it('locks after the auto-lock time, also after returning from the background', async () => {
    let onChange: ((s: string) => void) | undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_e, h) => {
      onChange = h as (s: string) => void;
      return { remove: jest.fn() };
    });
    const env = await unlocked();
    expect(w(env).autoLockLabel).toBe('5 min');
    env.clock.t += 4 * 60_000;
    await act(async () => onChange?.('active'));
    expect(w(env).screen).toBe('home');
    env.clock.t += 60_000;
    await act(async () => onChange?.('active'));
    expect(w(env).screen).toBe('pin');
    jest.restoreAllMocks();
  });

  it('persists the auto-lock setting', async () => {
    const env = await unlocked();
    await press(env, (x) => x.cycleLock());
    expect(w(env).autoLockLabel).toBe('15 min');
    expect(env.deps.settings.autoLockMinutes()).toBe(15);
  });

  it('handles the Android back button on the lock screen by leaving the app', async () => {
    const env = (await setup({ wallet: true })) as Env;
    expect(w(env).systemBack()).toBe(false);
  });
});

describe('settings', () => {
  it('shows the phrase only after the PIN and forgets it when closed', async () => {
    const env = await unlocked();
    await press(env, (x) => x.revealPhrase());
    expect(w(env).pinTitle).toBe('PIN eingeben');
    await typePin(env, PIN);
    await waitFor(() => expect(w(env).screen).toBe('reveal'));
    expect(
      w(env)
        .revealWords.map((x) => x.w)
        .join(' '),
    ).toBe(ABOUT);
    await press(env, (x) => x.closeReveal());
    expect(w(env).revealWords).toEqual([]);
  });

  it('changes the PIN: old → new → confirm', async () => {
    const env = await unlocked();
    await press(env, (x) => x.changePin());
    expect(w(env).pinTitle).toBe('PIN ändern');
    await typePin(env, '999999');
    expect(w(env).pinError).toBe('Falsche PIN. Noch 4 Versuche.');
    await typePin(env, PIN);
    expect(w(env).pinTitle).toBe('Neue PIN festlegen');
    await typePin(env, '246802');
    expect(w(env).pinTitle).toBe('Neue PIN bestätigen');
    await typePin(env, '246802');
    await waitFor(() => expect(w(env).screen).toBe('settings'));
    expect(w(env).toast).toBe('PIN geändert');
    expect((await env.keyring.unlock('246802')).evm).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
  });

  it('resets vault, device secret, counter and settings', async () => {
    const env = await unlocked();
    await press(env, (x) => x.cycleLock());
    await press(env, (x) => x.openReset());
    await press(env, (x) => x.doReset());
    expect(w(env).resetOpen).toBe(true); // checkbox required first
    expect(await env.keyring.hasWallet()).toBe(true);
    await press(env, (x) => x.toggleResetChk());
    await press(env, (x) => x.doReset());
    expect(w(env).screen).toBe('welcome');
    expect(env.store.dump()).toEqual({});
    expect(env.deps.settings.autoLockMinutes()).toBe(5);
  });
});

describe('signing sheet', () => {
  it('requires the real PIN before a (mock) send', async () => {
    const env = await unlocked();
    await press(env, (x) => x.sendAssets.find((a) => a.id === 'usdc-base')!.onClick());
    await press(env, (x) => x.recents[0]!.onClick());
    await press(env, (x) => x.toNext());
    for (const k of ['1', '0']) await press(env, (x) => x.amtKeys.find((y) => y.label === k)!.onClick());
    await press(env, (x) => x.amtNext());
    await press(env, (x) => x.sendConfirm());
    await typePin(env, '000000', 'confirmKeys');
    expect(w(env).confirmError).toBe('Falsche PIN. Noch 4 Versuche.');
    await typePin(env, PIN, 'confirmKeys');
    await waitFor(() => expect(w(env).screen).toBe('status'));
  });

  it('pastes from the clipboard instead of a fixed address', async () => {
    const env = await unlocked();
    (env.deps.readClipboard as jest.Mock).mockResolvedValue(' 0x71C9a3F2b8D4e6A1c0E5f7B9d2A4c6E8f0a104Ae \n');
    await press(env, (x) => x.sendAssets.find((a) => a.id === 'usdc-base')!.onClick());
    await press(env, (x) => x.pasteTo());
    expect(w(env).sTo).toBe('0x71C9a3F2b8D4e6A1c0E5f7B9d2A4c6E8f0a104Ae');
    await press(env, (x) => x.scanTo());
    expect(w(env).toast).toBe('QR-Scan folgt in einer späteren Version');
  });
});

describe('swap and navigation (mock data)', () => {
  it('opens the slippage sheet, warns above 1 % and closes overlays on back', async () => {
    const env = await unlocked();
    await press(env, (x) => x.goSwap());
    await press(env, (x) => x.openSlip());
    await press(env, (x) => x.slipOpts.find((s) => s.label === '3,0 %')!.onClick());
    expect(w(env).slipWarn).toBe(true);
    await press(env, (x) => void x.systemBack());
    expect(w(env).slipOpen).toBe(false);
    await press(env, (x) => void x.systemBack());
    expect(w(env).screen).toBe('home');
  });

  it('returns from other tabs to the portfolio', async () => {
    const env = await unlocked();
    await press(env, (x) => x.navRight[1]!.onClick());
    expect(w(env).screen).toBe('settings');
    await press(env, (x) => void x.systemBack());
    expect(w(env).screen).toBe('home');
    expect(w(env).systemBack()).toBe(false);
  });
});
