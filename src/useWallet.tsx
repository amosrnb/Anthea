import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { Network } from './core/address';
import { wipe } from './core/bytes';
import { scanBitcoin } from './core/btcScan';
import type { AccountPublic } from './core/derive';
import { checkMnemonic, generateEntropy, splitWords, suggestWords, toMnemonic } from './core/mnemonic';
import { formatWait } from './core/pinPolicy';
import { createVerifyChallenge, reshuffle, type VerifyRow } from './core/verify';
import { AUTO_LOCK_OPTIONS, type AutoLockMinutes } from './platform/settings';
import type { PinCheck } from './state/session';
import type { WalletDeps } from './state/appServices';
import {
  ACC,
  ADDR,
  ASSETS,
  COINS,
  FEES,
  INITIAL_ACTIVITY,
  IND,
  INK,
  MUT,
  NEG,
  POS,
  RATES,
  RCV,
  RECENT,
  RPCS,
  SWAPPABLE,
  WARN,
  type ActivityItem,
  type Asset,
  type Currency,
  type Family,
} from './data';
import { chart, famOf, nf, pc, qrMatrix, short, validateAddress } from './lib';
import { Icon, StarIcon } from './ui/icons';

export type Screen =
  | 'boot'
  | 'welcome'
  | 'warn'
  | 'seed'
  | 'verify'
  | 'import'
  | 'pin'
  | 'home'
  | 'markets'
  | 'coin'
  | 'receive'
  | 'sendAsset'
  | 'sendTo'
  | 'sendAmt'
  | 'sendReview'
  | 'swap'
  | 'swapReview'
  | 'status'
  | 'activity'
  | 'tx'
  | 'settings'
  | 'rpc'
  | 'reveal';
export type Tab = 'home' | 'markets' | 'activity' | 'settings';
type PinMode = 'set' | 'confirm' | 'unlock' | 'reveal' | 'changeOld' | 'changeNew' | 'changeConfirm';
type HRange = '24H' | '7D' | '30D' | '1J';
type CRange = '1H' | '24H' | '7D' | '30D' | '1J';

/** Testnet until mainnet is enabled in Phase 11 (BUILD_PLAN 2.8). */
export const NETWORK: Network = 'testnet';

interface StatusCfg {
  title: string;
  doneTitle: string;
  sub: string;
  rows: { k: string; v: string }[];
  t: ActivityItem['t'];
  actTitle: string;
  actSub: string;
  actAmt: string;
  pendingStatus: string;
  fee: string;
  done?: boolean;
}

interface State {
  screen: Screen;
  pinMode: PinMode;
  flow: 'create' | 'import';
  tab: Tab;
  checks: boolean[];
  seedShown: boolean;
  picks: Record<number, string>;
  /** Backup check: 3 random positions with options, reshuffled each time the verify step opens. */
  verify: VerifyRow[];
  importText: string;
  /** Number of digits typed; the digits themselves live in a ref only until the KDF runs (BUILD_PLAN 8). */
  pinLen: number;
  pinError: string;
  /** A PIN check (scrypt) is running. */
  busy: boolean;
  /** Epoch ms until PIN entry is blocked after too many wrong PINs (BUILD_PLAN 5.3). */
  lockedUntil: number;
  /** Public data of the unlocked wallet; null while locked or before onboarding. */
  accounts: AccountPublic | null;
  autoLock: AutoLockMinutes;
  cPinLen: number;
  cPinError: string;
  currency: Currency;
  netFilter: string;
  hRange: HRange;
  mSearch: string;
  mTab: 'Top' | 'Watchlist';
  watch: string[];
  coin: string;
  cRange: CRange;
  rcvAsset: string;
  rcvNet: string;
  sAsset: string;
  sTo: string;
  sAmt: string;
  sFiat: boolean;
  sFee: number;
  swFrom: string;
  swTo: string;
  swPct: number;
  slip: number;
  slipOpen: boolean;
  quoteT: number;
  status: StatusCfg | null;
  confirmOpen: boolean;
  resetOpen: boolean;
  resetChk: boolean;
  toast: string | null;
  txSel: string;
  activity: ActivityItem[];
}

type Patch = Partial<State> | ((s: State) => Partial<State>);

export interface Row {
  k: string;
  v: string;
  ink: string;
  divider: string;
}

function initialState(autoLock: AutoLockMinutes): State {
  return {
    screen: 'boot',
    pinMode: 'unlock',
    flow: 'create',
    tab: 'home',
    checks: [false, false, false],
    seedShown: false,
    picks: {},
    verify: [],
    importText: '',
    pinLen: 0,
    pinError: '',
    busy: false,
    lockedUntil: 0,
    accounts: null,
    autoLock,
    cPinLen: 0,
    cPinError: '',
    currency: 'EUR',
    netFilter: 'Alle',
    hRange: '24H',
    mSearch: '',
    mTab: 'Top',
    watch: ['btc', 'sol'],
    coin: 'eth',
    cRange: '24H',
    rcvAsset: 'USDC',
    rcvNet: 'Base',
    sAsset: 'usdc-base',
    sTo: '',
    sAmt: '',
    sFiat: false,
    sFee: 1,
    swFrom: 'usdc-base',
    swTo: 'eth-base',
    swPct: 25,
    slip: 0.5,
    slipOpen: false,
    quoteT: 30,
    status: null,
    confirmOpen: false,
    resetOpen: false,
    resetChk: false,
    toast: null,
    txSel: 'a1',
    activity: INITIAL_ACTIVITY,
  };
}

const TABS: Tab[] = ['home', 'markets', 'activity', 'settings'];
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/** Screens where the phrase is on screen or typed: screenshot protection (BUILD_PLAN 5.4). */
export const PHRASE_SCREENS: readonly Screen[] = ['seed', 'verify', 'import', 'reveal'];

const wrongPinText = (left: number) => 'Falsche PIN. Noch ' + left + (left === 1 ? ' Versuch.' : ' Versuche.');

export function useWallet(deps: WalletDeps) {
  const { session, settings, now } = deps;
  const [S, setRaw] = useState<State>(() => initialState(settings.autoLockMinutes()));
  const latest = useRef(S);
  useLayoutEffect(() => {
    latest.current = S;
  });
  const setState = (patch: Patch) => setRaw((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const later = (key: string, ms: number, fn: () => void) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, ms);
  };
  const confirmRun = useRef<(() => void) | null>(null);

  // Secrets are kept out of React state: PIN digits only until the KDF, phrase entropy and words only during
  // onboarding or while "Phrase anzeigen" is open (BUILD_PLAN 5.3, 8).
  const pinBuf = useRef('');
  const cPinBuf = useRef('');
  const firstPin = useRef('');
  const oldPin = useRef('');
  const entropy = useRef<Uint8Array | null>(null);
  // Words must be rendered, so they live in their own state (never in the settings or persisted state).
  const [phrase, setPhrase] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const lastActive = useRef(now());

  const clearSecrets = () => {
    pinBuf.current = cPinBuf.current = firstPin.current = oldPin.current = '';
    wipe(entropy.current);
    entropy.current = null;
    setPhrase([]);
    setRevealed([]);
  };

  // Start: wallet present → PIN screen (with a running wait from earlier failures), otherwise onboarding.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const has = await session.hasWallet();
      const wait = has ? await session.lockedFor() : 0;
      if (!cancelled) setState({ screen: has ? 'pin' : 'welcome', pinMode: 'unlock', lockedUntil: wait ? now() + wait : 0 });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once at startup
  }, []);

  // Quote refresh countdown while the swap screen is open.
  useEffect(() => {
    const q = setInterval(() => {
      if (latest.current.screen === 'swap') setState((s) => ({ quoteT: s.quoteT <= 1 ? 30 : s.quoteT - 1 }));
    }, 1000);
    const t = timers.current;
    return () => {
      clearInterval(q);
      Object.values(t).forEach(clearTimeout);
    };
  }, []);

  const flash = (m: string) => {
    setState({ toast: m });
    later('toast', 2400, () => setState({ toast: null }));
  };

  /** Locks the wallet: drops public data and every transient secret, shows the PIN screen. */
  const lock = () => {
    clearSecrets();
    Object.values(timers.current).forEach(clearTimeout);
    setState({
      screen: 'pin',
      pinMode: 'unlock',
      pinLen: 0,
      pinError: '',
      busy: false,
      accounts: null,
      confirmOpen: false,
      resetOpen: false,
      cPinLen: 0,
      cPinError: '',
      toast: null,
    });
  };
  const isUnlocked = (s: State) => s.accounts !== null && !(s.screen === 'pin' && s.pinMode === 'unlock');

  // Auto-lock after inactivity (BUILD_PLAN 5.3). Time in the background counts: timers pause there, so the check
  // also runs when the app becomes active again.
  useEffect(() => {
    const check = () => {
      const s = latest.current;
      if (isUnlocked(s) && now() - lastActive.current >= s.autoLock * 60_000) lock();
    };
    const tick = setInterval(check, 5000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && check());
    return () => {
      clearInterval(tick);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lock and isUnlocked only read refs and setters
  }, []);

  // Countdown while PIN entry is blocked.
  useEffect(() => {
    if (!S.lockedUntil) return;
    const t = setInterval(() => {
      if (now() >= latest.current.lockedUntil) setState({ lockedUntil: 0, pinError: '', cPinError: '' });
      else setState({});
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restarts only when a wait starts or ends
  }, [S.lockedUntil]);

  const lockedMs = Math.max(0, S.lockedUntil - now());
  const lockText = lockedMs > 0 ? 'Zu viele Versuche. Erneut möglich in ' + formatWait(lockedMs) : '';

  /** Maps a failed guarded PIN check to the error text and the wait (BUILD_PLAN 5.3 texts). */
  const failure = (r: Exclude<PinCheck<unknown>, { ok: true }>) => {
    if (r.lockedFor > 0) return { lockedUntil: now() + r.lockedFor, text: '' };
    return { lockedUntil: 0, text: r.reason === 'wrong-pin' ? wrongPinText(r.left) : '' };
  };

  /** Signing requires the PIN; checked against the vault with the attempt limit. */
  const runConfirm = async (p: string) => {
    if (!latest.current.confirmOpen) return;
    setState({ busy: true });
    const r = await session.verifyPin(p);
    cPinBuf.current = '';
    if (r.ok) {
      setState({ busy: false, confirmOpen: false, cPinLen: 0, cPinError: '' });
      confirmRun.current?.();
      return;
    }
    const f = failure(r);
    setState({ busy: false, cPinLen: 0, cPinError: f.text, lockedUntil: f.lockedUntil });
  };
  const openConfirm = (run: () => void) => {
    confirmRun.current = run;
    cPinBuf.current = '';
    setState({ confirmOpen: true, cPinLen: 0, cPinError: '' });
  };
  const confirmPress = (k: string) => {
    if (S.busy || lockedMs > 0) return;
    if (k === 'del') {
      cPinBuf.current = cPinBuf.current.slice(0, -1);
      return setState({ cPinLen: cPinBuf.current.length, cPinError: '' });
    }
    if (!k || cPinBuf.current.length >= 6) return;
    cPinBuf.current += k;
    const p = cPinBuf.current;
    setState({ cPinLen: p.length, cPinError: '' });
    if (p.length === 6) later('cpin', 150, () => void runConfirm(p));
  };

  const startStatus = (cfg: StatusCfg) => {
    // eslint-disable-next-line react-hooks/purity -- runs from the PIN confirmation handler, never during render
    const id = 'n' + Date.now();
    const item: ActivityItem = {
      id,
      t: cfg.t,
      title: cfg.actTitle,
      sub: cfg.actSub,
      amt: cfg.actAmt,
      status: cfg.pendingStatus,
      day: 'HEUTE',
      time: '09:41',
      fee: cfg.fee,
    };
    setState((s) => ({ screen: 'status', status: { ...cfg, done: false }, activity: [item].concat(s.activity), txSel: id }));
    later('status', 2600, () =>
      setState((s) => ({
        status: s.status && { ...s.status, done: true },
        activity: s.activity.map((a) => (a.id === id ? { ...a, status: 'Bestätigt' } : a)),
      })),
    );
  };

  /** New wallet or import: writes the vault, derives addresses, scans Bitcoin on import (BUILD_PLAN Phase 2.3). */
  const finishOnboarding = async (pin: string) => {
    const e = entropy.current;
    if (!e) return setState({ busy: false, screen: 'welcome' });
    let accounts: AccountPublic;
    try {
      accounts = await session.create(e, pin, NETWORK);
    } catch {
      setState({ busy: false, pinMode: 'set', pinLen: 0, pinError: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' });
      return;
    }
    const imported = latest.current.flow === 'import';
    clearSecrets();
    let toast = 'Wallet bereit';
    if (imported) {
      try {
        accounts = await scanBitcoin(accounts, (a) => deps.isBtcAddressUsed(a, NETWORK));
        await session.saveAccounts(accounts);
        toast = 'Konten abgeleitet · Bitcoin-Scan abgeschlossen';
      } catch {
        toast = 'Konten abgeleitet · Bitcoin-Scan fehlgeschlagen';
      }
    }
    lastActive.current = now();
    setState({ busy: false, screen: 'home', tab: 'home', accounts, pinLen: 0, pinError: '' });
    flash(toast);
  };

  const pinDone = async (p: string) => {
    const s = latest.current;
    pinBuf.current = '';
    const next = (patch: Partial<State>) => setState({ pinLen: 0, busy: false, ...patch });
    if (s.pinMode === 'set' || s.pinMode === 'changeNew') {
      firstPin.current = p;
      return next({ pinMode: s.pinMode === 'set' ? 'confirm' : 'changeConfirm', pinError: '' });
    }
    if (s.pinMode === 'confirm' || s.pinMode === 'changeConfirm') {
      const match = p === firstPin.current;
      firstPin.current = '';
      const retry = s.pinMode === 'confirm' ? 'set' : 'changeNew';
      if (!match) return next({ pinMode: retry, pinError: 'PINs stimmen nicht überein. Bitte neu festlegen.' });
      setState({ busy: true });
      if (s.pinMode === 'confirm') return finishOnboarding(p);
      const r = await session.changePin(oldPin.current, p);
      oldPin.current = '';
      if (!r.ok) return next({ pinMode: 'changeOld', ...failureState(r) });
      next({ screen: 'settings', pinMode: 'unlock', pinError: '' });
      return flash('PIN geändert');
    }
    setState({ busy: true });
    if (s.pinMode === 'unlock') {
      const r = await session.unlock(p);
      if (!r.ok) return next(failureState(r));
      lastActive.current = now();
      return next({ screen: 'home', tab: 'home', accounts: r.value, pinError: '' });
    }
    if (s.pinMode === 'reveal') {
      const r = await session.revealPhrase(p);
      if (!r.ok) return next(failureState(r));
      setRevealed(r.value);
      return next({ screen: 'reveal', pinMode: 'unlock', pinError: '' });
    }
    // changeOld
    const r = await session.verifyPin(p);
    if (!r.ok) return next(failureState(r));
    oldPin.current = p;
    next({ pinMode: 'changeNew', pinError: '' });
  };
  const failureState = (r: Exclude<PinCheck<unknown>, { ok: true }>): Partial<State> => {
    const f = failure(r);
    return { pinError: f.text, lockedUntil: f.lockedUntil };
  };
  const pinPress = (k: string) => {
    if (S.busy || lockedMs > 0) return;
    if (k === 'del') {
      pinBuf.current = pinBuf.current.slice(0, -1);
      return setState({ pinLen: pinBuf.current.length, pinError: '' });
    }
    if (!k || pinBuf.current.length >= 6) return;
    pinBuf.current += k;
    const p = pinBuf.current;
    setState({ pinLen: p.length, pinError: '' });
    if (p.length === 6) later('pin', 150, () => void pinDone(p));
  };

  // ---- derived view values ----
  const cur = S.currency,
    rate = RATES[cur];
  const fiat = (eur: number | null) => (eur == null ? '–' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: cur }).format(eur * rate));
  const set = (o: Partial<State>) => () => setState(o);
  const chip = (on: boolean) => ({ bg: on ? INK : '#141418', ink: on ? '#000000' : MUT });
  const div = (i: number) => (i === 0 ? 'transparent' : 'rgba(255,255,255,.06)');
  const rows = (list: { k: string; v: string; ink?: string }[]): Row[] => list.map((r, i) => ({ ink: INK, ...r, divider: div(i) }));
  const tag = (a: Asset) =>
    a.unverified
      ? { tag: 'NICHT VERIFIZIERT', tagInk: WARN, tagBg: 'rgba(232,196,106,.14)' }
      : { tag: a.net.toUpperCase(), tagInk: MUT, tagBg: 'rgba(255,255,255,.06)' };
  const A = (id: string) => ASSETS.find((a) => a.id === id)!;
  const scr = S.screen;

  const backMap: Partial<Record<Screen, Screen>> = {
    warn: 'welcome',
    seed: 'warn',
    verify: 'seed',
    import: 'welcome',
    coin: S.tab,
    receive: S.tab,
    sendAsset: S.tab,
    sendTo: 'sendAsset',
    sendAmt: 'sendTo',
    sendReview: 'sendAmt',
    swap: S.tab,
    swapReview: 'swap',
    tx: 'activity',
    rpc: 'settings',
    reveal: 'settings',
  };
  const back = () => {
    if (scr === 'pin') {
      pinBuf.current = firstPin.current = oldPin.current = '';
      clearTimeout(timers.current.pin);
      const inSettings = S.pinMode === 'reveal' || S.pinMode.startsWith('change');
      return setState({
        screen: inSettings ? 'settings' : S.flow === 'import' ? 'import' : 'verify',
        pinLen: 0,
        pinError: '',
        pinMode: inSettings ? 'unlock' : 'set',
      });
    }
    if (scr === 'reveal') setRevealed([]);
    if (scr === 'warn' || scr === 'import') clearSecrets();
    setState({ screen: backMap[scr] || 'home', slipOpen: false });
  };
  /**
   * Platform back action (Android back button/gesture, iOS edge swipe). Closes the topmost overlay,
   * otherwise navigates back. Returns false when the OS should handle it (root screens: leave the app).
   */
  const systemBack = (): boolean => {
    if (S.confirmOpen) {
      clearTimeout(timers.current.cpin);
      cPinBuf.current = '';
      setState({ confirmOpen: false, cPinLen: 0, cPinError: '' });
      return true;
    }
    if (S.resetOpen) {
      setState({ resetOpen: false });
      return true;
    }
    if (S.slipOpen) {
      setState({ slipOpen: false });
      return true;
    }
    if (scr === 'boot' || scr === 'welcome' || scr === 'home' || (scr === 'pin' && S.pinMode === 'unlock')) return false;
    if (scr === 'markets' || scr === 'activity' || scr === 'settings' || scr === 'status') {
      setState({ screen: 'home', tab: 'home' });
      return true;
    }
    back();
    return true;
  };
  const lockNow = lock;
  const startSend = (id?: string) => setState({ screen: id ? 'sendTo' : 'sendAsset', sAsset: id || S.sAsset, sTo: '', sAmt: '', sFiat: false, sFee: 1 });
  const startRecv = (sym: string) => setState({ screen: 'receive', rcvAsset: sym, rcvNet: RCV[sym]?.[0] ?? 'Ethereum' });
  const startSwap = (id?: string) => {
    const swTo =
      id === 'eth-base' || !id
        ? S.swTo
        : id === 'usdc-base'
          ? 'eth-base'
          : famOf(A(id).net) === 'sol'
            ? id === 'sol-sol'
              ? 'jup-sol'
              : 'sol-sol'
            : 'usdc-base';
    setState({ screen: 'swap', swFrom: id && SWAPPABLE.includes(id) ? id : S.swFrom, swTo, quoteT: 30 });
  };

  // Onboarding
  const warnTexts = ['Wer die Wörter kennt, besitzt das Geld.', 'Anthea kann sie nicht wiederherstellen.', 'Ich bewahre sie offline und sicher auf.'];
  const warnRows = warnTexts.map((text, i) => ({
    text,
    on: S.checks[i],
    onClick: () =>
      setState((s) => {
        const c = s.checks.slice();
        c[i] = !c[i];
        return { checks: c };
      }),
  }));
  const warnOk = S.checks.every(Boolean);
  const seedWords = phrase.map((w, i) => ({ n: i + 1, w }));
  const verifyRows = S.verify.map((v) => ({
    pos: v.pos,
    opts: v.opts.map((w) => {
      const picked = S.picks[v.pos] === w,
        right = phrase[v.pos - 1] === w;
      return {
        w,
        bg: picked ? (right ? IND : 'rgba(255,143,128,.18)') : '#141418',
        ink: picked ? (right ? '#FFFFFF' : NEG) : INK,
        onClick: () => setState((s) => ({ picks: { ...s.picks, [v.pos]: w } })),
      };
    }),
  }));
  const verifyOk = S.verify.length > 0 && S.verify.every((v) => S.picks[v.pos] === phrase[v.pos - 1]);

  // Import: real BIP39 validation with the design's texts (BUILD_PLAN Phase 2.2).
  const check = checkMnemonic(S.importText);
  const typed = splitWords(S.importText);
  const importValid = check.kind === 'ok';
  const importMsg =
    check.kind === 'invalid-word'
      ? '„' + check.word + '“ ist kein gültiges BIP39-Wort'
      : check.kind === 'bad-checksum'
        ? 'Prüfsumme ungültig. Prüfe Reihenfolge und Schreibweise.'
        : check.kind === 'ok'
          ? 'Prüfsumme gültig'
          : check.kind === 'bad-length'
            ? typed.length + ' Wörter · höchstens 24'
            : typed.length + (typed.length > 12 ? ' / 24 Wörter' : ' / 12 Wörter');
  const partial = !/\s$/.test(S.importText) && typed.length ? typed[typed.length - 1]! : '';
  const importSugg = suggestWords(partial).map((w) => ({
    w,
    onClick: () => setState((s) => ({ importText: s.importText.replace(/\S+$/, w) + ' ' })),
  }));

  const pinTitles: Record<PinMode, string> = {
    set: 'PIN festlegen',
    confirm: 'PIN bestätigen',
    unlock: 'Anthea ist gesperrt',
    reveal: 'PIN eingeben',
    changeOld: 'PIN ändern',
    changeNew: 'Neue PIN festlegen',
    changeConfirm: 'Neue PIN bestätigen',
  };
  const pinSubs: Record<PinMode, string> = {
    set: '6 Ziffern. Sie schützt dein Wallet auf diesem Gerät.',
    confirm: 'Gib die PIN noch einmal ein.',
    unlock: 'PIN eingeben.',
    reveal: 'Für die Phrase ist die PIN nötig.',
    changeOld: 'Gib zuerst deine aktuelle PIN ein.',
    changeNew: '6 Ziffern. Sie schützt dein Wallet auf diesem Gerät.',
    changeConfirm: 'Gib die neue PIN noch einmal ein.',
  };
  const pinDots = [0, 1, 2, 3, 4, 5].map((i) => (i < S.pinLen || S.busy ? IND : '#2A2A32'));
  const keyFace = (k: string) => ({
    label: k === 'del' ? '' : k,
    icon: (k === 'del' ? <Icon name="del" color={INK} size={24} weight={1.9} /> : null) as ReactNode,
    bg: k && k !== 'del' ? '#141418' : 'transparent',
  });
  const pinKeys = KEYPAD.map((k) => ({ ...keyFace(k), onClick: () => pinPress(k) }));

  // Home
  const known = ASSETS.filter((a) => a.price != null);
  const totalEur = known.reduce((s, a) => s + a.bal * a.price!, 0);
  const deltaEur = known.reduce((s, a) => s + (a.bal * a.price! * a.chg!) / 100, 0);
  const hDefs: Record<HRange, [number, number, number]> = { '24H': [1, 1.1, 1], '7D': [1.4, 2.2, 4.2], '30D': [1.8, -3.4, -2.6], '1J': [2.4, 6, 41.8] };
  const hd = hDefs[S.hRange];
  const hPct = S.hRange === '24H' ? (deltaEur / totalEur) * 100 : hd[2];
  const hChart = chart(S.hRange.charCodeAt(0) + S.hRange.length * 7, 44, hd[0], hd[1], 300, 64);
  const rangeBtn = (on: boolean) => ({ bg: on ? '#2A2A32' : 'transparent', ink: on ? INK : MUT });
  const hRanges = (Object.keys(hDefs) as HRange[]).map((r) => ({ label: r, ...rangeBtn(r === S.hRange), onClick: set({ hRange: r }) }));
  const actions = [
    { label: 'Senden', k: 'send' as const, primary: true, onClick: () => startSend() },
    { label: 'Empfangen', k: 'recv' as const, primary: false, onClick: () => startRecv(S.rcvAsset) },
    { label: 'Swappen', k: 'swap' as const, primary: false, onClick: () => startSwap() },
  ].map((a) => ({ label: a.label, bg: a.primary ? IND : '#141418', icon: <Icon name={a.k} color="#FFFFFF" size={26} weight={2.6} />, onClick: a.onClick }));
  const nets = ['Alle'].concat(ASSETS.map((a) => a.net).filter((n, i, arr) => arr.indexOf(n) === i));
  const netChips = nets.map((n) => ({ label: n, ...chip(S.netFilter === n), onClick: set({ netFilter: n }) }));
  const holdRow = (a: Asset) => ({
    ...a,
    ...tag(a),
    sub: nf(a.bal, a.dec) + ' ' + a.sym + (a.pending ? ' · ' + nf(a.pending, 5) + ' unbestätigt' : ''),
    value: a.price == null ? '–' : fiat(a.bal * a.price),
    chg: a.price == null ? 'Kein Preis' : pc(a.chg),
    chgInk: a.chg == null ? MUT : a.chg >= 0 ? POS : NEG,
  });
  const holdings = ASSETS.filter((a) => S.netFilter === 'Alle' || a.net === S.netFilter).map((a) => ({
    ...holdRow(a),
    onClick: () => (a.coin ? setState({ screen: 'coin', coin: a.coin, cRange: '24H' }) : flash('Nicht verifizierter Token. Kein Marktpreis verfügbar.')),
  }));

  // Markets
  const q = S.mSearch.trim().toLowerCase();
  const coins = COINS.map((c, i) => ({ ...c, rank: i + 1 }))
    .filter((c) => (S.mTab === 'Top' || S.watch.includes(c.id)) && (!q || c.name.toLowerCase().includes(q) || c.sym.toLowerCase().includes(q)))
    .map((c) => ({
      ...c,
      price: fiat(c.price),
      chg: pc(c.chg),
      chgInk: c.chg >= 0 ? POS : NEG,
      spark: chart(c.id.charCodeAt(0) + c.id.length, 20, 1, c.chg, 64, 24).line,
      onClick: () => setState({ screen: 'coin', coin: c.id, cRange: '24H' }),
    }));
  const mTabs = (['Top', 'Watchlist'] as const).map((t) => ({ label: t, ...chip(S.mTab === t), onClick: set({ mTab: t }) }));

  // Coin detail
  const C = COINS.find((c) => c.id === S.coin) || COINS[1]!;
  const cDefs: Record<CRange, [number, number, number]> = {
    '1H': [0.5, 0.3, 0.21],
    '24H': [1, 1, C.chg],
    '7D': [1.4, 2.2, 6.4],
    '30D': [1.8, -3, -3.8],
    '1J': [2.4, 6, 48.2],
  };
  const cd = cDefs[S.cRange];
  const cChart = chart(C.id.charCodeAt(0) * 3 + S.cRange.length * 11, 52, cd[0], cd[1] * (cd[2] < 0 ? -1 : 1) * Math.sign(cd[1] || 1), 300, 120);
  const inWatch = S.watch.includes(C.id);
  const coinAsset = C.asset;

  // Receive
  const rNets = RCV[S.rcvAsset] || ['Ethereum'];
  const rNet = rNets.includes(S.rcvNet) ? S.rcvNet : rNets[0]!;
  const rFam = famOf(rNet);
  // The wallet's own derived addresses (Bitcoin: first unused receive address). Mock only in the web preview.
  const own = (fam: Family) => (S.accounts ? (fam === 'btc' ? S.accounts.btc.receive[S.accounts.btc.receive.length - 1]! : S.accounts[fam]) : ADDR[fam]);
  const rAddr = own(rFam);
  const rQr = qrMatrix(rAddr);

  // Send
  const sA = A(S.sAsset) || ASSETS[2]!;
  const sFam = famOf(sA.net);
  const fees = FEES[sFam === 'evm' ? (sA.net === 'Ethereum' ? 'eth' : 'l2') : sFam];
  const fee = fees[S.sFee] ?? fees[1]!;
  const amtNum = parseFloat((S.sAmt || '0').replace(',', '.')) || 0;
  const canFiat = sA.price != null;
  const tokenAmt = S.sFiat && canFiat ? amtNum / (sA.price! * rate) : amtNum;
  const native = ['ETH', 'SOL', 'BTC'].includes(sA.sym);
  const over = tokenAmt > sA.bal;
  const amtValid = tokenAmt > 0 && !over;
  const msgStyle = {
    ok: [POS, 'rgba(168,230,168,.1)'],
    info: [ACC, 'rgba(108,92,231,.12)'],
    warn: ['#F2DDA4', 'rgba(232,196,106,.12)'],
    err: [NEG, 'rgba(255,143,128,.1)'],
  } as const;
  const v = validateAddress(S.sTo, sFam, sA.sym, sA.net);
  const toMsg = v ? { text: v.text, ink: msgStyle[v.kind][0], bg: msgStyle[v.kind][1] } : null;
  const toValid = !!v && v.kind !== 'err';
  const amtInfo = over
    ? 'Nicht genug ' + sA.sym + ' · Guthaben ' + nf(sA.bal, sA.dec)
    : tokenAmt > sA.bal * 0.5
      ? 'Mehr als 50 % deines Guthabens'
      : 'Guthaben ' + nf(sA.bal, sA.dec) + ' ' + sA.sym;
  const amtKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((k) => ({
    label: k === 'del' ? '' : k,
    icon: (k === 'del' ? <Icon name="del" color={INK} size={22} weight={1.9} /> : null) as ReactNode,
    onClick: () =>
      setState((s) => {
        let a = s.sAmt;
        if (k === 'del') a = a.slice(0, -1);
        else if (k === ',') {
          if (!a.includes(',')) a = (a || '0') + ',';
        } else if (a.length < 12) a = a === '0' ? k : a + k;
        return { sAmt: a };
      }),
  }));
  const feeOpts = fees.map((f, i) => ({ label: f.l, time: f.t, cost: fiat(f.eur), ring: i === S.sFee ? IND : 'transparent', onClick: set({ sFee: i }) }));
  const revWarns: { text: string; ink: string; bg: string }[] = [];
  if (v && v.kind === 'warn') revWarns.push({ text: v.text, ink: msgStyle.warn[0], bg: msgStyle.warn[1] });
  if (v && v.kind === 'info') revWarns.push({ text: v.text, ink: msgStyle.info[0], bg: msgStyle.info[1] });
  if (tokenAmt > sA.bal * 0.5 && !over) revWarns.push({ text: 'Du sendest mehr als 50 % deines Guthabens.', ink: msgStyle.info[0], bg: msgStyle.info[1] });
  const tokenFiat = canFiat ? tokenAmt * sA.price! : null;
  const revRows = rows([
    { k: 'Netzwerk', v: sA.net + (NETWORK === 'testnet' ? ' (Testnetz)' : '') },
    { k: 'Von', v: short(own(sFam)) },
    { k: 'An', v: S.sTo.trim() },
    { k: 'Netzwerkgebühr', v: fiat(fee.eur) + ' · ' + fee.l },
    { k: 'Gesamt', v: canFiat ? fiat(tokenFiat! + fee.eur) : nf(tokenAmt, sA.dec) + ' ' + sA.sym + ' + ' + fiat(fee.eur) },
    { k: 'Simulation', v: 'Erfolgreich', ink: POS },
  ]);
  const confirmCta = 'Mit PIN bestätigen';

  // Swap
  const F = A(S.swFrom),
    T = A(S.swTo);
  const fFam = famOf(F.net),
    tFam = famOf(T.net);
  const cross = F.net !== T.net;
  const provider = fFam === 'sol' && tFam === 'sol' ? 'Jupiter' : 'LI.FI';
  const swAmtN = (F.bal * S.swPct) / 100;
  const impact = 0.05 + (S.swPct / 100) * 3.2;
  const outN = (swAmtN * F.price! * (1 - impact / 100)) / T.price!;
  const minOut = outN * (1 - S.slip / 100);
  const swFee = cross ? 0.91 : fFam === 'sol' ? 0.004 : F.net === 'Ethereum' ? 1.6 : 0.06;
  const route = cross ? provider + ' · ' + F.net + ' → ' + T.net : provider + ' · ' + F.net;
  const quoteRows = rows([
    { k: 'Kurs', v: '1 ' + F.sym + ' = ' + nf(F.price! / T.price!, T.dec) + ' ' + T.sym },
    { k: 'Mindestempfang', v: nf(minOut, T.dec) + ' ' + T.sym },
    { k: 'Preisauswirkung', v: nf(impact, 2) + ' %', ink: impact > 3 ? WARN : INK },
    { k: cross ? 'Netzwerk + Brücke' : 'Netzwerkgebühr', v: fiat(swFee) },
    { k: 'Route', v: route },
    { k: 'Dauer', v: cross ? '~2 min' : '~15 s' },
  ]);
  const cycle = (curId: string, other: string) => {
    const i = SWAPPABLE.indexOf(curId);
    for (let j = 1; j <= SWAPPABLE.length; j++) {
      const n = SWAPPABLE[(i + j) % SWAPPABLE.length]!;
      if (n !== other) return n;
    }
    return curId;
  };
  const pctChips = [25, 50, 75, 100].map((p) => ({
    label: p === 100 ? 'Max' : p + ' %',
    bg: S.swPct === p ? 'rgba(108,92,231,.16)' : '#141418',
    ink: S.swPct === p ? ACC : MUT,
    onClick: set({ swPct: p }),
  }));
  const slipOpts = [0.1, 0.5, 1, 3].map((s) => ({
    label: nf(s, 1) + ' %',
    bg: S.slip === s ? IND : '#1E1E23',
    ink: S.slip === s ? '#FFFFFF' : INK,
    onClick: set({ slip: s }),
  }));
  const needsApprove = fFam === 'evm' && F.sym !== 'ETH';
  const swapSteps = (needsApprove ? [{ title: 'Freigabe · exakt ' + nf(swAmtN, 2) + ' ' + F.sym, sub: 'Keine unbegrenzte Freigabe' }] : [])
    .concat([{ title: 'Swap ' + F.sym + ' → ' + T.sym, sub: route }])
    .map((s, i) => ({ ...s, n: i + 1 }));
  const swapRevRows = rows([
    { k: 'Du zahlst', v: nf(swAmtN, F.dec) + ' ' + F.sym },
    { k: 'Du erhältst (erwartet)', v: nf(outN, T.dec) + ' ' + T.sym },
    { k: 'Mindestempfang', v: nf(minOut, T.dec) + ' ' + T.sym },
    { k: 'Gebühren', v: fiat(swFee) + ' · Integrator 0 %' },
    { k: 'Vertrag', v: provider === 'Jupiter' ? 'Jupiter-Programm · Allowlist' : 'LI.FI Diamond · Allowlist', ink: POS },
    { k: 'Simulation', v: 'Erfolgreich', ink: POS },
  ]);

  // Status / activity
  const st = S.status;
  const stDone = !!st?.done;
  const stColors: Record<string, [string, string]> = {
    Bestätigt: [POS, 'rgba(168,230,168,.1)'],
    Ausstehend: [WARN, 'rgba(232,196,106,.12)'],
    Unbestätigt: [WARN, 'rgba(232,196,106,.12)'],
    Unterwegs: [ACC, 'rgba(108,92,231,.14)'],
  };
  const activity = S.activity.map((a, i, arr) => ({
    ...a,
    showHeader: i === 0 || arr[i - 1]!.day !== a.day,
    icon: <Icon name={a.t === 'recv' ? 'recv' : a.t === 'send' ? 'send' : 'swap'} color={a.t === 'recv' ? POS : ACC} size={19} weight={2.4} />,
    amtInk: a.amt[0] === '+' ? POS : INK,
    stInk: (stColors[a.status] || [MUT])[0],
    stBg: (stColors[a.status] || [MUT, 'rgba(255,255,255,.06)'])[1],
    onClick: () => setState({ screen: 'tx', txSel: a.id }),
  }));
  const tx = activity.find((a) => a.id === S.txSel) || activity[0]!;
  const txRows = rows([
    { k: 'Status', v: tx.status, ink: tx.stInk },
    { k: 'Details', v: tx.sub },
    { k: 'Gebühr', v: tx.fee },
    { k: 'Zeit', v: (tx.day === 'HEUTE' ? 'Heute' : 'Gestern') + ', ' + tx.time },
    { k: 'Tx-Hash', v: '0x8f3a…c21d' },
  ]);

  const navLabels: Record<Tab, string> = { home: 'Portfolio', markets: 'Märkte', activity: 'Aktivität', settings: 'Einstellungen' };
  const nav = TABS.map((k) => ({
    label: navLabels[k],
    icon: <Icon name={k} color={S.tab === k ? IND : MUT} />,
    ink: S.tab === k ? ACC : MUT,
    onClick: () => setState({ screen: k, tab: k }),
  }));

  return {
    screen: scr,
    back,
    systemBack,
    lockNow,
    testnet: NETWORK === 'testnet',
    /** Any touch counts as activity for the auto-lock. */
    touch: () => {
      lastActive.current = now();
    },
    isPhraseScreen: PHRASE_SCREENS.includes(scr),
    screenshotWarning: () => flash('Screenshot erkannt. Die Phrase gehört nur auf Papier.'),
    toast: S.toast,

    // onboarding
    startCreate: () => {
      clearSecrets();
      entropy.current = generateEntropy();
      const words = toMnemonic(entropy.current).split(' ');
      setPhrase(words);
      setState({ screen: 'warn', flow: 'create', checks: [false, false, false], seedShown: false, picks: {}, verify: createVerifyChallenge(words) });
    },
    startImport: () => {
      clearSecrets();
      setState({ screen: 'import', flow: 'import', importText: '' });
    },
    warnRows,
    warnOk,
    warnNext: () => warnOk && setState({ screen: 'seed' }),
    seedWords,
    seedShown: S.seedShown,
    revealSeed: set({ seedShown: true }),
    seedNext: () => S.seedShown && setState({ screen: 'verify', picks: {}, verify: reshuffle(S.verify) }),
    verifyRows,
    verifyOk,
    verifyNext: () => verifyOk && setState({ screen: 'pin', pinMode: 'set', pinLen: 0, pinError: '' }),
    importText: S.importText,
    onImport: (text: string) => setState({ importText: text }),
    importMsg,
    importInk: check.kind === 'invalid-word' || check.kind === 'bad-checksum' || check.kind === 'bad-length' ? NEG : importValid ? POS : MUT,
    importSugg,
    importValid,
    importNext: () => {
      if (check.kind !== 'ok') return;
      wipe(entropy.current);
      entropy.current = check.entropy;
      setState({ screen: 'pin', pinMode: 'set', pinLen: 0, pinError: '', importText: '' });
    },
    pinTitle: pinTitles[S.pinMode],
    pinSub: pinSubs[S.pinMode],
    pinDots,
    pinKeys,
    pinError: lockText || S.pinError,
    pinCanBack: S.pinMode !== 'unlock' && !S.busy,
    pinLocked: lockedMs > 0,

    // home
    total: fiat(totalEur),
    totalDelta: pc(hPct),
    totalDeltaInk: hPct < 0 ? NEG : ACC,
    totalAbs: (hPct < 0 ? '−' : '+') + fiat(Math.abs((totalEur * hPct) / 100)),
    hRangeLabel: S.hRange === '24H' ? '24 Std.' : S.hRange,
    hChart,
    hRanges,
    actions,
    netChips,
    holdings,
    goScan: () => startSend(),
    goSwap: () => startSwap(),
    goHome: () => setState({ screen: 'home', tab: 'home' }),

    // markets / coin
    mSearch: S.mSearch,
    onSearch: (text: string) => setState({ mSearch: text }),
    mTabs,
    coins,
    coinsEmptyText: S.mTab === 'Watchlist' && !q ? 'Noch keine Favoriten. Markiere Coins in der Detailansicht mit dem Stern.' : 'Keine Treffer.',
    coin: { ...C, price: fiat(C.price) },
    cChart,
    cChartDelta: pc(cd[2]),
    cChartInk: cd[2] < 0 ? NEG : ACC,
    cRangeLabel: 'Zeitraum ' + S.cRange + ' · Live',
    cRanges: (Object.keys(cDefs) as CRange[]).map((r) => ({ label: r, ...rangeBtn(r === S.cRange), onClick: set({ cRange: r }) })),
    coinStats: [
      { k: 'MARKTKAP.', v: C.cap },
      { k: 'VOLUMEN 24H', v: C.vol },
      { k: 'HOCH 24H', v: fiat(C.hi) },
      { k: 'TIEF 24H', v: fiat(C.lo) },
    ],
    starIcon: <StarIcon color={inWatch ? WARN : INK} filled={inWatch} />,
    toggleWatch: () => {
      setState((s) => ({ watch: inWatch ? s.watch.filter((x) => x !== C.id) : s.watch.concat(C.id) }));
      flash(inWatch ? 'Aus Watchlist entfernt' : 'Zur Watchlist hinzugefügt');
    },
    coinSupported: C.supported !== false,
    coinReceive: () => startRecv(C.sym),
    coinSend: () => (coinAsset ? startSend(coinAsset) : flash('Kein ' + C.sym + '-Guthaben vorhanden')),
    coinSwap: () =>
      coinAsset && SWAPPABLE.includes(coinAsset)
        ? startSwap(coinAsset)
        : flash(C.sym === 'BTC' ? 'Bitcoin-Swaps folgen in einer späteren Version' : 'Kein ' + C.sym + '-Guthaben vorhanden'),

    // receive
    rcvAssets: Object.keys(RCV).map((s) => ({ label: s, ...chip(S.rcvAsset === s), onClick: set({ rcvAsset: s, rcvNet: RCV[s]![0] }) })),
    rcvNets: rNets.map((n) => ({ label: n, bg: n === rNet ? 'rgba(108,92,231,.18)' : '#141418', ink: n === rNet ? ACC : MUT, onClick: set({ rcvNet: n }) })),
    qr: rQr,
    rcvAddr: rAddr.match(/.{1,4}/g)!.join(' '),
    rcvNote: rFam === 'btc' ? 'Native SegWit · nach Nutzung neue Adresse' : rFam === 'evm' ? 'Gleiche Adresse auf allen EVM-Netzen' : 'Solana-Adresse',
    rcvWarn: 'Sende nur ' + S.rcvAsset + ' über ' + rNet + ' an diese Adresse. Andere Netzwerke können zum Verlust führen.',
    copyAddr: () => flash('Adresse kopiert'),
    shareAddr: () => flash('Teilen geöffnet'),

    // send
    sendAssets: ASSETS.map((a) => ({ ...holdRow(a), onClick: () => startSend(a.id) })),
    sendHead: sA.sym + ' über ' + sA.net,
    sTo: S.sTo,
    onTo: (text: string) => setState({ sTo: text.replace(/\s/g, '') }),
    toPlaceholder: sFam === 'evm' ? '0x… Adresse' : sFam === 'sol' ? 'Solana-Adresse' : 'bc1… Adresse',
    pasteTo: async () => {
      const text = await deps.readClipboard().catch(() => '');
      setState({ sTo: text.replace(/\s/g, '') });
    },
    scanTo: () => flash('QR-Scan folgt in einer späteren Version'),
    toMsg,
    recents: [{ short: short(RECENT[sFam]), note: 'Zuletzt am 12. Sep', onClick: set({ sTo: RECENT[sFam] }) }],
    toValid,
    toNext: () => toValid && setState({ screen: 'sendAmt' }),
    toShort: short(S.sTo.trim()),
    amtMain: S.sAmt || '0',
    amtUnit: S.sFiat && canFiat ? cur : sA.sym,
    amtAlt: S.sFiat && canFiat ? nf(tokenAmt, sA.dec) + ' ' + sA.sym : fiat(tokenFiat),
    toggleFiat: () => canFiat && setState({ sFiat: !S.sFiat, sAmt: '' }),
    setMax: () => {
      const m = Math.max(0, native ? sA.bal - fee.eur / sA.price! : sA.bal);
      setState({ sFiat: false, sAmt: m.toFixed(sA.dec).replace('.', ',') });
    },
    amtInfo,
    amtInfoInk: over ? NEG : MUT,
    amtKeys,
    feeOpts,
    amtValid,
    amtNext: () => amtValid && setState({ screen: 'sendReview' }),
    revAmount: nf(tokenAmt, sA.dec) + ' ' + sA.sym,
    revFiat: canFiat ? fiat(tokenFiat) : 'Kein Marktpreis',
    revRows,
    revWarns,
    confirmCta,
    sendConfirm: () =>
      openConfirm(() =>
        startStatus({
          title: 'Wird gesendet',
          doneTitle: 'Gesendet',
          sub: nf(tokenAmt, sA.dec) + ' ' + sA.sym + ' an ' + short(S.sTo.trim()),
          rows: [
            { k: 'Netzwerk', v: sA.net },
            { k: 'Gebühr', v: fiat(fee.eur) },
            { k: 'Tx-Hash', v: '0x8f3a…c21d' },
          ],
          t: 'send',
          actTitle: 'Gesendet',
          actSub: sA.net + ' · ' + short(S.sTo.trim()),
          actAmt: '−' + nf(tokenAmt, sA.dec) + ' ' + sA.sym,
          pendingStatus: 'Ausstehend',
          fee: fiat(fee.eur),
        }),
      ),

    // swap
    slipLabel: nf(S.slip, 1) + ' %',
    openSlip: set({ slipOpen: true }),
    closeSlip: set({ slipOpen: false }),
    slipOpen: S.slipOpen,
    slipOpts,
    slipWarn: S.slip > 1,
    swF: { ...F, balLabel: nf(F.bal, F.dec) },
    swT: T,
    swAmt: nf(swAmtN, F.dec),
    swAmtFiat: fiat(swAmtN * F.price!),
    swOut: nf(outN, T.dec),
    quoteLeft: 'Quote ' + S.quoteT + ' s',
    quoteBar: (S.quoteT / 30) * 100,
    quoteRows,
    impactWarn: impact > 3,
    pctChips,
    cycleFrom: set({ swFrom: cycle(S.swFrom, S.swTo), quoteT: 30 }),
    cycleTo: set({ swTo: cycle(S.swTo, S.swFrom), quoteT: 30 }),
    flipSwap: set({ swFrom: S.swTo, swTo: S.swFrom, quoteT: 30 }),
    swapNext: set({ screen: 'swapReview' }),
    swapSteps,
    swapRevRows,
    swapConfirm: () =>
      openConfirm(() =>
        startStatus({
          title: cross ? 'Swap unterwegs' : 'Swap läuft',
          doneTitle: cross ? 'Angekommen' : 'Swap abgeschlossen',
          sub: nf(swAmtN, F.dec) + ' ' + F.sym + ' → ' + nf(outN, T.dec) + ' ' + T.sym,
          rows: [
            { k: 'Route', v: route },
            { k: 'Mindestempfang', v: nf(minOut, T.dec) + ' ' + T.sym },
            { k: 'Gebühr', v: fiat(swFee) },
          ],
          t: 'swap',
          actTitle: F.sym + ' → ' + T.sym,
          actSub: route,
          actAmt: '+' + nf(outN, T.dec) + ' ' + T.sym,
          pendingStatus: cross ? 'Unterwegs' : 'Ausstehend',
          fee: fiat(swFee),
        }),
      ),

    // status / activity / tx
    stDone,
    stTitle: st ? (stDone ? st.doneTitle : st.title) : '',
    stSub: st?.sub || '',
    stRows: rows(st?.rows || []),
    openExplorer: () => flash('Explorer im Browser geöffnet'),
    activity,
    tx,
    txRows,

    // settings
    currency: cur,
    cycleCur: () => {
      const k = Object.keys(RATES) as Currency[];
      setState({ currency: k[(k.indexOf(cur) + 1) % k.length]! });
    },
    goRpc: set({ screen: 'rpc' }),
    rpcs: RPCS.map(([net, url], i) => ({ net, url, fb: i === 7 ? '+1 Fallback' : '+2 Fallbacks', divider: div(i) })),
    addRpc: () => flash('Nur HTTPS-Endpunkte werden akzeptiert'),
    tokensInfo: () => flash('Token per Vertragsadresse hinzufügen'),
    changePin: () => {
      pinBuf.current = firstPin.current = oldPin.current = '';
      setState({ screen: 'pin', pinMode: 'changeOld', pinLen: 0, pinError: '' });
    },
    autoLockLabel: S.autoLock + ' min',
    cycleLock: () => {
      const next = AUTO_LOCK_OPTIONS[(AUTO_LOCK_OPTIONS.indexOf(S.autoLock) + 1) % AUTO_LOCK_OPTIONS.length]!;
      settings.setAutoLockMinutes(next);
      setState({ autoLock: next });
    },
    revealPhrase: () => setState({ screen: 'pin', pinMode: 'reveal', pinLen: 0, pinError: '' }),
    revealWords: revealed.map((w, i) => ({ n: i + 1, w })),
    closeReveal: () => {
      setRevealed([]);
      setState({ screen: 'settings' });
    },
    privacyInfo: () => flash('Keine Analytics, kein Tracking, keine Crash-Reports'),
    resetOpen: S.resetOpen,
    openReset: set({ resetOpen: true, resetChk: false }),
    closeReset: set({ resetOpen: false }),
    resetChk: S.resetChk,
    toggleResetChk: set({ resetChk: !S.resetChk }),
    doReset: async () => {
      if (!S.resetChk) return;
      // Vault, device secret, PIN counter, public data and settings (BUILD_PLAN 5.3).
      await session.reset();
      settings.clear();
      clearSecrets();
      setState({ ...initialState(settings.autoLockMinutes()), screen: 'welcome', pinMode: 'set' });
    },

    // overlays / chrome
    confirmOpen: S.confirmOpen,
    confirmDots: [0, 1, 2, 3, 4, 5].map((i) => (i < S.cPinLen || (S.busy && S.confirmOpen) ? IND : '#2A2A32')),
    confirmKeys: KEYPAD.map((k) => ({ ...keyFace(k), onClick: () => confirmPress(k) })),
    confirmError: lockText || S.cPinError,
    closeConfirm: () => {
      clearTimeout(timers.current.cpin);
      cPinBuf.current = '';
      setState({ confirmOpen: false, cPinLen: 0, cPinError: '' });
    },
    showDock: (TABS as Screen[]).includes(scr),
    navLeft: nav.slice(0, 2),
    navRight: nav.slice(2),
  };
}

export type Wallet = ReturnType<typeof useWallet>;
