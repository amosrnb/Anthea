import { act, renderHook } from '@testing-library/react-native';
import { SEED } from '../data';
import { useWallet, type WalletProps } from '../useWallet';

const setup = (props: Partial<WalletProps> = {}) => renderHook(() => useWallet({ startScreen: 'welcome', testnet: true, privacyMode: false, ...props }));
type W = ReturnType<typeof useWallet>;
type Hook = Awaited<ReturnType<typeof setup>>;

async function press(hook: Hook, fn: (w: W) => void) {
  await act(async () => fn(hook.result.current));
}
async function typePin(hook: Hook, digits: string, keys: 'pinKeys' | 'confirmKeys' = 'pinKeys') {
  for (const d of digits) await press(hook, (w) => w[keys].find((k) => k.label === d)!.onClick());
  await act(async () => jest.advanceTimersByTime(250));
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('onboarding', () => {
  it('creates a wallet: warnings → seed → verify → PIN → home', async () => {
    const h = await setup();
    await press(h, (w) => w.startCreate());
    expect(h.result.current.screen).toBe('warn');

    await press(h, (w) => w.warnNext());
    expect(h.result.current.screen).toBe('warn'); // all three boxes required
    for (const i of [0, 1, 2]) await press(h, (w) => w.warnRows[i]!.onClick());
    await press(h, (w) => w.warnNext());
    expect(h.result.current.screen).toBe('seed');

    await press(h, (w) => w.seedNext());
    expect(h.result.current.screen).toBe('seed'); // must reveal first
    await press(h, (w) => w.revealSeed());
    await press(h, (w) => w.seedNext());
    expect(h.result.current.screen).toBe('verify');

    for (const row of h.result.current.verifyRows) {
      await press(h, (w) =>
        w.verifyRows
          .find((r) => r.pos === row.pos)!
          .opts.find((o) => o.w === SEED[row.pos - 1])!
          .onClick(),
      );
    }
    expect(h.result.current.verifyOk).toBe(true);
    await press(h, (w) => w.verifyNext());
    expect(h.result.current.pinTitle).toBe('PIN festlegen');

    await typePin(h, '135790');
    expect(h.result.current.pinTitle).toBe('PIN bestätigen');
    await typePin(h, '135790');
    expect(h.result.current.screen).toBe('home');
    expect(h.result.current.toast).toBe('Wallet bereit');
  });

  it('restarts PIN setup when the confirmation differs', async () => {
    const h = await setup();
    await press(h, (w) => w.startImport());
    await press(h, (w) => w.onImport(SEED.join(' ')));
    await press(h, (w) => w.importNext());
    await typePin(h, '111111');
    await typePin(h, '222222');
    expect(h.result.current.pinTitle).toBe('PIN festlegen');
    expect(h.result.current.pinError).toBe('PINs stimmen nicht überein. Bitte neu festlegen.');
  });

  it('validates imported phrases against the word list', async () => {
    const h = await setup();
    await press(h, (w) => w.startImport());
    await press(h, (w) => w.onImport('orbit velvet xyz '));
    expect(h.result.current.importMsg).toBe('„xyz“ ist kein gültiges BIP39-Wort');
    expect(h.result.current.importValid).toBe(false);

    await press(h, (w) => w.onImport('orbit velvet har'));
    expect(h.result.current.importSugg.map((s) => s.w)).toEqual(['harbor', 'harvest']);
    await press(h, (w) => w.importSugg[0]!.onClick());
    expect(h.result.current.importText).toBe('orbit velvet harbor ');

    await press(h, (w) => w.onImport(SEED.join(' ')));
    expect(h.result.current.importMsg).toBe('Prüfsumme gültig');
    await press(h, (w) => w.importNext());
    await typePin(h, '123456');
    await typePin(h, '123456');
    expect(h.result.current.toast).toBe('Konten abgeleitet · Bitcoin-Scan abgeschlossen');
  });
});

describe('lock and PIN', () => {
  it('unlocks with the PIN set during onboarding and rejects others', async () => {
    const h = await setup();
    await press(h, (w) => w.startImport());
    await press(h, (w) => w.onImport(SEED.join(' ')));
    await press(h, (w) => w.importNext());
    await typePin(h, '123456');
    await typePin(h, '123456');
    await press(h, (w) => w.lockNow());
    expect(h.result.current.pinTitle).toBe('Anthea ist gesperrt');
    expect(h.result.current.pinCanBack).toBe(false);

    await typePin(h, '000000');
    expect(h.result.current.pinError).toBe('Falsche PIN. Noch 4 Versuche.');
    await typePin(h, '123456');
    expect(h.result.current.screen).toBe('home');
  });

  it('requires the PIN before revealing the phrase', async () => {
    const h = await setup({ startScreen: 'home' });
    await press(h, (w) => w.revealPhrase());
    expect(h.result.current.screen).toBe('pin');
    expect(h.result.current.pinTitle).toBe('PIN eingeben');
    await typePin(h, '123456');
    expect(h.result.current.screen).toBe('reveal');
    expect(h.result.current.seedWords.map((s) => s.w)).toEqual(SEED);
  });
});

describe('send', () => {
  it('walks asset → recipient → amount → review → PIN → status → activity', async () => {
    const h = await setup({ startScreen: 'home' });
    await press(h, (w) => w.actions[0]!.onClick());
    expect(h.result.current.screen).toBe('sendAsset');
    await press(h, (w) => w.sendAssets.find((a) => a.id === 'usdc-base')!.onClick());
    expect(h.result.current.sendHead).toBe('USDC über Base');

    await press(h, (w) => w.pasteTo());
    expect(h.result.current.toMsg?.text).toMatch(/Address-Poisoning/);
    await press(h, (w) => w.recents[0]!.onClick());
    expect(h.result.current.toMsg?.text).toBe('Bekannter Empfänger · zuletzt am 12. Sep.');
    await press(h, (w) => w.toNext());
    expect(h.result.current.screen).toBe('sendAmt');

    for (const k of ['1', '0', '0', '0', '0']) await press(h, (w) => w.amtKeys.find((x) => x.label === k)!.onClick());
    expect(h.result.current.amtValid).toBe(false);
    expect(h.result.current.amtInfo).toBe('Nicht genug USDC · Guthaben 2.683,10');
    await press(h, (w) => w.amtKeys.find((x) => x.label === '')!.onClick()); // delete
    expect(h.result.current.amtMain).toBe('1000');
    await press(h, (w) => w.amtNext());
    expect(h.result.current.screen).toBe('sendReview');
    expect(h.result.current.revAmount).toBe('1.000,00 USDC');

    await press(h, (w) => w.sendConfirm());
    expect(h.result.current.confirmOpen).toBe(true);
    await typePin(h, '123456', 'confirmKeys');
    expect(h.result.current.screen).toBe('status');
    expect(h.result.current.stTitle).toBe('Wird gesendet');
    expect(h.result.current.activity[0]!.status).toBe('Ausstehend');

    await act(async () => jest.advanceTimersByTime(2700));
    expect(h.result.current.stTitle).toBe('Gesendet');
    expect(h.result.current.activity[0]!.status).toBe('Bestätigt');
  });

  it('computes Max as balance minus fee for native coins', async () => {
    const h = await setup({ startScreen: 'home' });
    await press(h, (w) => w.sendAssets.find((a) => a.id === 'sol-sol')!.onClick());
    await press(h, (w) => w.setMax());
    expect(h.result.current.amtMain).toBe('18,204');
  });
});

describe('swap', () => {
  it('opens the slippage sheet and warns above 1 %', async () => {
    const h = await setup({ startScreen: 'home' });
    await press(h, (w) => w.goSwap());
    expect(h.result.current.screen).toBe('swap');
    await press(h, (w) => w.openSlip());
    await press(h, (w) => w.slipOpts.find((s) => s.label === '3,0 %')!.onClick());
    expect(h.result.current.slipWarn).toBe(true);
    expect(h.result.current.slipLabel).toBe('3,0 %');
  });

  it('flags high price impact for large amounts and requires an exact approval', async () => {
    const h = await setup({ startScreen: 'home' });
    await press(h, (w) => w.goSwap());
    await press(h, (w) => w.pctChips.find((c) => c.label === 'Max')!.onClick());
    expect(h.result.current.impactWarn).toBe(true);
    await press(h, (w) => w.swapNext());
    expect(h.result.current.swapSteps.map((s) => s.sub)).toEqual(['Keine unbegrenzte Freigabe', 'LI.FI · Base']);
  });
});

describe('systemBack (Android back / iOS edge swipe)', () => {
  it('lets the OS handle root screens', async () => {
    const h = await setup();
    expect(h.result.current.systemBack()).toBe(false);
    const home = await setup({ startScreen: 'home' });
    expect(home.result.current.systemBack()).toBe(false);
    const lock = await setup({ startScreen: 'lock' });
    expect(lock.result.current.systemBack()).toBe(false);
  });

  it('closes overlays before navigating', async () => {
    const h = await setup({ startScreen: 'home' });
    await press(h, (w) => w.goSwap());
    await press(h, (w) => w.openSlip());
    await press(h, (w) => void w.systemBack());
    expect(h.result.current.slipOpen).toBe(false);
    expect(h.result.current.screen).toBe('swap');
    await press(h, (w) => void w.systemBack());
    expect(h.result.current.screen).toBe('home');
  });

  it('returns from other tabs to the portfolio', async () => {
    const h = await setup({ startScreen: 'home' });
    await press(h, (w) => w.navRight[1]!.onClick());
    expect(h.result.current.screen).toBe('settings');
    await press(h, (w) => void w.systemBack());
    expect(h.result.current.screen).toBe('home');
    expect(h.result.current.navLeft[0]!.ink).toBe('#A79BFF');
  });
});
