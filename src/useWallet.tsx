import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  ACC, ADDR, ASSETS, COINS, FEES, FRESH, INITIAL_ACTIVITY, IND, INK, MUT, NEG, POISON, POS, RATES, RCV, RECENT, RPCS, SEED, SWAPPABLE, VERIFY, WARN, WORDS,
  type ActivityItem, type Asset, type Currency
} from './data';
import { chart, famOf, nf, pc, qrCells, short, validateAddress } from './lib';
import { Icon, StarIcon } from './icons';

export type Screen =
  | 'welcome' | 'warn' | 'seed' | 'verify' | 'import' | 'pin' | 'password'
  | 'home' | 'markets' | 'coin' | 'receive'
  | 'sendAsset' | 'sendTo' | 'sendAmt' | 'sendReview'
  | 'swap' | 'swapReview' | 'status' | 'activity' | 'tx' | 'settings' | 'rpc' | 'reveal';
export type Tab = 'home' | 'markets' | 'activity' | 'settings';
type PinMode = 'set' | 'confirm' | 'unlock' | 'reveal';
type HRange = '24H' | '7D' | '30D' | '1J';
type CRange = '1H' | '24H' | '7D' | '30D' | '1J';

export interface WalletProps {
  startScreen: 'welcome' | 'lock' | 'home';
  testnet: boolean;
  privacyMode: boolean;
}

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
  screen: Screen; pinMode: PinMode; flow: 'create' | 'import'; tab: Tab;
  checks: boolean[]; seedShown: boolean; picks: Record<number, string>; importText: string;
  pin: string; pinFirst: string; pinError: string; autoLock: number;
  password: string; pwA: string; pwB: string; pwVisible: boolean; pwEntry: string; pwError: string; currency: Currency;
  netFilter: string; hRange: HRange; mSearch: string; mTab: 'Top' | 'Watchlist'; watch: string[]; coin: string; cRange: CRange;
  rcvAsset: string; rcvNet: string;
  sAsset: string; sTo: string; sAmt: string; sFiat: boolean; sFee: number;
  swFrom: string; swTo: string; swPct: number; slip: number; slipOpen: boolean; quoteT: number;
  status: StatusCfg | null; confirmOpen: boolean; resetOpen: boolean; resetChk: boolean; toast: string | null; txSel: string;
  activity: ActivityItem[];
}

type Patch = Partial<State> | ((s: State) => Partial<State>);

export interface Row { k: string; v: string; ink: string; divider: string }

function initialState(start: WalletProps['startScreen']): State {
  return {
    screen: start === 'lock' ? 'pin' : start, pinMode: start === 'lock' ? 'unlock' : 'set', flow: 'create', tab: 'home',
    checks: [false, false, false], seedShown: false, picks: {}, importText: '',
    pin: '', pinFirst: '', pinError: '', autoLock: 5,
    password: '', pwA: '', pwB: '', pwVisible: false, pwEntry: '', pwError: '', currency: 'EUR',
    netFilter: 'Alle', hRange: '24H', mSearch: '', mTab: 'Top', watch: ['btc', 'sol'], coin: 'eth', cRange: '24H',
    rcvAsset: 'USDC', rcvNet: 'Base',
    sAsset: 'usdc-base', sTo: '', sAmt: '', sFiat: false, sFee: 1,
    swFrom: 'usdc-base', swTo: 'eth-base', swPct: 25, slip: 0.5, slipOpen: false, quoteT: 30,
    status: null, confirmOpen: false, resetOpen: false, resetChk: false, toast: null, txSel: 'a1',
    activity: INITIAL_ACTIVITY
  };
}

const TABS: Tab[] = ['home', 'markets', 'activity', 'settings'];

export function useWallet(P: WalletProps) {
  const [S, setRaw] = useState<State>(() => initialState(P.startScreen));
  const latest = useRef(S);
  latest.current = S;
  const setState = (patch: Patch) => setRaw((s) => ({ ...s, ...(typeof patch === 'function' ? patch(s) : patch) }));

  const timers = useRef<Record<string, number>>({});
  const later = (key: string, ms: number, fn: () => void) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = window.setTimeout(fn, ms);
  };
  const confirmRun = useRef<(() => void) | null>(null);

  // Quote refresh countdown while the swap screen is open.
  useEffect(() => {
    const q = window.setInterval(() => {
      if (latest.current.screen === 'swap') setState((s) => ({ quoteT: s.quoteT <= 1 ? 30 : s.quoteT - 1 }));
    }, 1000);
    const t = timers.current;
    return () => { clearInterval(q); Object.values(t).forEach(clearTimeout); };
  }, []);

  const flash = (m: string) => { setState({ toast: m }); later('toast', 2400, () => setState({ toast: null })); };

  /** Signing requires the wallet password. Without one set (onboarding skipped via ?start=), any entry is accepted. */
  const runConfirm = () => {
    const s = latest.current;
    if (!s.confirmOpen || !s.pwEntry) return;
    if (s.password && s.pwEntry !== s.password) return setState({ pwError: 'Falsches Passwort.', pwEntry: '' });
    setState({ confirmOpen: false, pwEntry: '', pwError: '' });
    confirmRun.current?.();
  };
  const openConfirm = (run: () => void) => {
    confirmRun.current = run;
    setState({ confirmOpen: true, pwEntry: '', pwError: '' });
  };

  const startStatus = (cfg: StatusCfg) => {
    const id = 'n' + Date.now();
    const item: ActivityItem = { id, t: cfg.t, title: cfg.actTitle, sub: cfg.actSub, amt: cfg.actAmt, status: cfg.pendingStatus, day: 'HEUTE', time: '09:41', fee: cfg.fee };
    setState((s) => ({ screen: 'status', status: { ...cfg, done: false }, activity: [item].concat(s.activity), txSel: id }));
    later('status', 2600, () => setState((s) => ({
      status: s.status && { ...s.status, done: true },
      activity: s.activity.map((a) => (a.id === id ? { ...a, status: 'Bestätigt' } : a))
    })));
  };

  const pinDone = (p: string) => {
    const s = latest.current;
    if (s.pinMode === 'set') return setState({ pinFirst: p, pin: '', pinMode: 'confirm' });
    if (s.pinMode === 'confirm') {
      if (p === s.pinFirst) return setState({ screen: 'password', pin: '', pwA: '', pwB: '', pwVisible: false });
      return setState({ pinMode: 'set', pin: '', pinFirst: '', pinError: 'PINs stimmen nicht überein. Bitte neu festlegen.' });
    }
    if (s.pinFirst && p !== s.pinFirst) return setState({ pin: '', pinError: 'Falsche PIN. Noch 4 Versuche.' });
    if (s.pinMode === 'unlock') return setState({ screen: 'home', tab: 'home', pin: '' });
    if (s.pinMode === 'reveal') return setState({ screen: 'reveal', pin: '' });
  };
  const pinPress = (k: string) => {
    if (k === 'del') return setState({ pin: S.pin.slice(0, -1), pinError: '' });
    if (!k || S.pin.length >= 6) return;
    const p = S.pin + k;
    setState({ pin: p, pinError: '' });
    if (p.length === 6) later('pin', 200, () => pinDone(p));
  };

  // ---- derived view values ----
  const cur = S.currency, rate = RATES[cur];
  const fiat = (eur: number | null) => (eur == null ? '–' : new Intl.NumberFormat('de-DE', { style: 'currency', currency: cur }).format(eur * rate));
  const set = (o: Partial<State>) => () => setState(o);
  const chip = (on: boolean) => ({ bg: on ? INK : '#141418', ink: on ? '#000000' : MUT });
  const div = (i: number) => (i === 0 ? 'transparent' : 'rgba(255,255,255,.06)');
  const rows = (list: { k: string; v: string; ink?: string }[]): Row[] => list.map((r, i) => ({ ink: INK, ...r, divider: div(i) }));
  const tag = (a: Asset) => (a.unverified
    ? { tag: 'NICHT VERIFIZIERT', tagInk: WARN, tagBg: 'rgba(232,196,106,.14)' }
    : { tag: a.net.toUpperCase(), tagInk: MUT, tagBg: 'rgba(255,255,255,.06)' });
  const A = (id: string) => ASSETS.find((a) => a.id === id)!;
  const scr = S.screen;

  const backMap: Partial<Record<Screen, Screen>> = {
    warn: 'welcome', seed: 'warn', verify: 'seed', import: 'welcome', coin: S.tab, receive: S.tab, sendAsset: S.tab,
    sendTo: 'sendAsset', sendAmt: 'sendTo', sendReview: 'sendAmt', swap: S.tab, swapReview: 'swap', tx: 'activity', rpc: 'settings', reveal: 'settings'
  };
  const back = () => {
    if (scr === 'pin') {
      const reveal = S.pinMode === 'reveal';
      return setState({ screen: reveal ? 'settings' : S.flow === 'import' ? 'import' : 'verify', pin: '', pinError: '', pinMode: reveal ? 'unlock' : 'set', pinFirst: reveal ? S.pinFirst : '' });
    }
    setState({ screen: backMap[scr] || 'home', slipOpen: false });
  };
  const lockNow = () => setState({ screen: 'pin', pinMode: 'unlock', pin: '', pinError: '' });
  const startSend = (id?: string) => setState({ screen: id ? 'sendTo' : 'sendAsset', sAsset: id || S.sAsset, sTo: '', sAmt: '', sFiat: false, sFee: 1 });
  const startRecv = (sym: string) => setState({ screen: 'receive', rcvAsset: sym, rcvNet: RCV[sym][0] });
  const startSwap = (id?: string) => {
    const swTo = id === 'eth-base' || !id ? S.swTo
      : id === 'usdc-base' ? 'eth-base'
      : famOf(A(id).net) === 'sol' ? (id === 'sol-sol' ? 'jup-sol' : 'sol-sol') : 'usdc-base';
    setState({ screen: 'swap', swFrom: id && SWAPPABLE.includes(id) ? id : S.swFrom, swTo, quoteT: 30 });
  };

  // Onboarding
  const warnTexts = ['Wer die Wörter kennt, besitzt das Geld.', 'Anthea kann sie nicht wiederherstellen.', 'Ich bewahre sie offline und sicher auf.'];
  const warnRows = warnTexts.map((text, i) => ({
    text, on: S.checks[i],
    onClick: () => setState((s) => { const c = s.checks.slice(); c[i] = !c[i]; return { checks: c }; })
  }));
  const warnOk = S.checks.every(Boolean);
  const seedWords = SEED.map((w, i) => ({ n: i + 1, w }));
  const verifyRows = VERIFY.map((v) => ({
    pos: v.pos,
    opts: v.opts.map((w) => {
      const picked = S.picks[v.pos] === w, right = SEED[v.pos - 1] === w;
      return {
        w,
        bg: picked ? (right ? IND : 'rgba(255,143,128,.18)') : '#141418',
        ink: picked ? (right ? '#FFFFFF' : NEG) : INK,
        onClick: () => setState((s) => ({ picks: { ...s.picks, [v.pos]: w } }))
      };
    })
  }));
  const verifyOk = VERIFY.every((v) => S.picks[v.pos] === SEED[v.pos - 1]);

  const iw = S.importText.normalize('NFKD').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const endsSpace = /\s$/.test(S.importText);
  const partial = !endsSpace && iw.length ? iw[iw.length - 1] : '';
  const complete = endsSpace ? iw : iw.slice(0, -1);
  const bad = complete.find((w) => !WORDS.includes(w)) || (iw.length === 12 && !WORDS.includes(iw[11]) ? iw[11] : null);
  const importValid = (iw.length === 12 || iw.length === 24) && !bad && iw.every((w) => WORDS.includes(w));
  const importMsg = bad ? '„' + bad + '“ ist kein gültiges BIP39-Wort' : importValid ? 'Prüfsumme gültig' : iw.length + ' / 12 Wörter';
  const importSugg = partial
    ? WORDS.filter((w, i, arr) => arr.indexOf(w) === i && w.startsWith(partial) && w !== partial).slice(0, 5).map((w) => ({
      w, onClick: () => setState((s) => ({ importText: s.importText.replace(/\S+$/, w) + ' ' }))
    }))
    : [];

  const pinTitles: Record<PinMode, string> = { set: 'PIN festlegen', confirm: 'PIN bestätigen', unlock: 'Anthea ist gesperrt', reveal: 'PIN eingeben' };
  const pinSubs: Record<PinMode, string> = {
    set: '6 Ziffern. Sie schützt dein Wallet auf diesem Gerät.', confirm: 'Gib die PIN noch einmal ein.',
    unlock: 'PIN eingeben.', reveal: 'Für die Phrase ist die PIN nötig.'
  };
  const pwLongEnough = S.pwA.length >= 8;
  const pwMatch = S.pwA === S.pwB;
  const pwValid = pwLongEnough && pwMatch;
  const pwMsg = !S.pwA ? 'Mindestens 8 Zeichen' : !pwLongEnough ? 'Noch ' + (8 - S.pwA.length) + ' Zeichen' : !S.pwB ? 'Passwort wiederholen' : pwMatch ? 'Passwort gültig' : 'Passwörter stimmen nicht überein';
  const pwMsgInk = S.pwA && pwLongEnough && S.pwB ? (pwMatch ? POS : NEG) : MUT;
  const pinDots = [0, 1, 2, 3, 4, 5].map((i) => (i < S.pin.length ? IND : '#2A2A32'));
  const pinKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => ({
    label: k === 'del' ? '' : k,
    icon: (k === 'del' ? <Icon name="del" color={INK} size={24} weight={1.9} /> : null) as ReactNode,
    bg: k && k !== 'del' ? '#141418' : 'transparent',
    onClick: () => pinPress(k)
  }));

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
    { label: 'Swappen', k: 'swap' as const, primary: false, onClick: () => startSwap() }
  ].map((a) => ({ label: a.label, bg: a.primary ? IND : '#141418', icon: <Icon name={a.k} color="#FFFFFF" size={26} weight={2.6} />, onClick: a.onClick }));
  const nets = ['Alle'].concat(ASSETS.map((a) => a.net).filter((n, i, arr) => arr.indexOf(n) === i));
  const netChips = nets.map((n) => ({ label: n, ...chip(S.netFilter === n), onClick: set({ netFilter: n }) }));
  const holdRow = (a: Asset) => ({
    ...a, ...tag(a),
    sub: nf(a.bal, a.dec) + ' ' + a.sym + (a.pending ? ' · ' + nf(a.pending, 5) + ' unbestätigt' : ''),
    value: a.price == null ? '–' : fiat(a.bal * a.price),
    chg: a.price == null ? 'Kein Preis' : pc(a.chg), chgInk: a.chg == null ? MUT : a.chg >= 0 ? POS : NEG
  });
  const holdings = ASSETS.filter((a) => S.netFilter === 'Alle' || a.net === S.netFilter).map((a) => ({
    ...holdRow(a),
    onClick: () => (a.coin ? setState({ screen: 'coin', coin: a.coin, cRange: '24H' }) : flash('Nicht verifizierter Token. Kein Marktpreis verfügbar.'))
  }));

  // Markets
  const q = S.mSearch.trim().toLowerCase();
  const coins = COINS.map((c, i) => ({ ...c, rank: i + 1 }))
    .filter((c) => (S.mTab === 'Top' || S.watch.includes(c.id)) && (!q || c.name.toLowerCase().includes(q) || c.sym.toLowerCase().includes(q)))
    .map((c) => ({
      ...c, price: fiat(c.price), chg: pc(c.chg), chgInk: c.chg >= 0 ? POS : NEG,
      spark: chart(c.id.charCodeAt(0) + c.id.length, 20, 1, c.chg, 64, 24).line,
      onClick: () => setState({ screen: 'coin', coin: c.id, cRange: '24H' })
    }));
  const mTabs = (['Top', 'Watchlist'] as const).map((t) => ({ label: t, ...chip(S.mTab === t), onClick: set({ mTab: t }) }));

  // Coin detail
  const C = COINS.find((c) => c.id === S.coin) || COINS[1];
  const cDefs: Record<CRange, [number, number, number]> = { '1H': [0.5, 0.3, 0.21], '24H': [1, 1, C.chg], '7D': [1.4, 2.2, 6.4], '30D': [1.8, -3, -3.8], '1J': [2.4, 6, 48.2] };
  const cd = cDefs[S.cRange];
  const cChart = chart(C.id.charCodeAt(0) * 3 + S.cRange.length * 11, 52, cd[0], cd[1] * (cd[2] < 0 ? -1 : 1) * Math.sign(cd[1] || 1), 300, 120);
  const inWatch = S.watch.includes(C.id);
  const coinAsset = C.asset;

  // Receive
  const rNets = RCV[S.rcvAsset] || ['Ethereum'];
  const rNet = rNets.includes(S.rcvNet) ? S.rcvNet : rNets[0];
  const rFam = famOf(rNet), rAddr = ADDR[rFam];

  // Send
  const sA = A(S.sAsset) || ASSETS[2];
  const sFam = famOf(sA.net);
  const fees = FEES[sFam === 'evm' ? (sA.net === 'Ethereum' ? 'eth' : 'l2') : sFam];
  const fee = fees[S.sFee];
  const amtNum = parseFloat((S.sAmt || '0').replace(',', '.')) || 0;
  const canFiat = sA.price != null;
  const tokenAmt = S.sFiat && canFiat ? amtNum / (sA.price! * rate) : amtNum;
  const native = ['ETH', 'SOL', 'BTC'].includes(sA.sym);
  const over = tokenAmt > sA.bal;
  const amtValid = tokenAmt > 0 && !over;
  const msgStyle = { ok: [POS, 'rgba(168,230,168,.1)'], info: [ACC, 'rgba(108,92,231,.12)'], warn: ['#F2DDA4', 'rgba(232,196,106,.12)'], err: [NEG, 'rgba(255,143,128,.1)'] } as const;
  const v = validateAddress(S.sTo, sFam, sA.sym, sA.net);
  const toMsg = v ? { text: v.text, ink: msgStyle[v.kind][0], bg: msgStyle[v.kind][1] } : null;
  const toValid = !!v && v.kind !== 'err';
  const amtInfo = over ? 'Nicht genug ' + sA.sym + ' · Guthaben ' + nf(sA.bal, sA.dec) : tokenAmt > sA.bal * 0.5 ? 'Mehr als 50 % deines Guthabens' : 'Guthaben ' + nf(sA.bal, sA.dec) + ' ' + sA.sym;
  const amtKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((k) => ({
    label: k === 'del' ? '' : k,
    icon: (k === 'del' ? <Icon name="del" color={INK} size={22} weight={1.9} /> : null) as ReactNode,
    onClick: () => setState((s) => {
      let a = s.sAmt;
      if (k === 'del') a = a.slice(0, -1);
      else if (k === ',') { if (!a.includes(',')) a = (a || '0') + ','; }
      else if (a.length < 12) a = a === '0' ? k : a + k;
      return { sAmt: a };
    })
  }));
  const feeOpts = fees.map((f, i) => ({ label: f.l, time: f.t, cost: fiat(f.eur), ring: i === S.sFee ? IND : 'transparent', onClick: set({ sFee: i }) }));
  const revWarns: { text: string; ink: string; bg: string }[] = [];
  if (v && v.kind === 'warn') revWarns.push({ text: v.text, ink: msgStyle.warn[0], bg: msgStyle.warn[1] });
  if (v && v.kind === 'info') revWarns.push({ text: v.text, ink: msgStyle.info[0], bg: msgStyle.info[1] });
  if (tokenAmt > sA.bal * 0.5 && !over) revWarns.push({ text: 'Du sendest mehr als 50 % deines Guthabens.', ink: msgStyle.info[0], bg: msgStyle.info[1] });
  const tokenFiat = canFiat ? tokenAmt * sA.price! : null;
  const revRows = rows([
    { k: 'Netzwerk', v: sA.net + (P.testnet ? ' (Testnetz)' : '') },
    { k: 'Von', v: short(ADDR[sFam]) },
    { k: 'An', v: S.sTo.trim() },
    { k: 'Netzwerkgebühr', v: fiat(fee.eur) + ' · ' + fee.l },
    { k: 'Gesamt', v: canFiat ? fiat(tokenFiat! + fee.eur) : nf(tokenAmt, sA.dec) + ' ' + sA.sym + ' + ' + fiat(fee.eur) },
    { k: 'Simulation', v: 'Erfolgreich', ink: POS }
  ]);
  const confirmCta = 'Mit Passwort bestätigen';

  // Swap
  const F = A(S.swFrom), T = A(S.swTo);
  const fFam = famOf(F.net), tFam = famOf(T.net);
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
    { k: 'Dauer', v: cross ? '~2 min' : '~15 s' }
  ]);
  const cycle = (curId: string, other: string) => {
    const i = SWAPPABLE.indexOf(curId);
    for (let j = 1; j <= SWAPPABLE.length; j++) { const n = SWAPPABLE[(i + j) % SWAPPABLE.length]; if (n !== other) return n; }
    return curId;
  };
  const pctChips = [25, 50, 75, 100].map((p) => ({
    label: p === 100 ? 'Max' : p + ' %', bg: S.swPct === p ? 'rgba(108,92,231,.16)' : '#141418', ink: S.swPct === p ? ACC : MUT, onClick: set({ swPct: p })
  }));
  const slipOpts = [0.1, 0.5, 1, 3].map((s) => ({ label: nf(s, 1) + ' %', bg: S.slip === s ? IND : '#1E1E23', ink: S.slip === s ? '#FFFFFF' : INK, onClick: set({ slip: s }) }));
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
    { k: 'Simulation', v: 'Erfolgreich', ink: POS }
  ]);

  // Status / activity
  const st = S.status;
  const stDone = !!st?.done;
  const stColors: Record<string, [string, string]> = {
    'Bestätigt': [POS, 'rgba(168,230,168,.1)'], 'Ausstehend': [WARN, 'rgba(232,196,106,.12)'],
    'Unbestätigt': [WARN, 'rgba(232,196,106,.12)'], 'Unterwegs': [ACC, 'rgba(108,92,231,.14)']
  };
  const activity = S.activity.map((a, i, arr) => ({
    ...a, showHeader: i === 0 || arr[i - 1].day !== a.day,
    icon: <Icon name={a.t === 'recv' ? 'recv' : a.t === 'send' ? 'send' : 'swap'} color={a.t === 'recv' ? POS : ACC} size={19} weight={2.4} />,
    amtInk: a.amt[0] === '+' ? POS : INK,
    stInk: (stColors[a.status] || [MUT])[0], stBg: (stColors[a.status] || [MUT, 'rgba(255,255,255,.06)'])[1],
    onClick: () => setState({ screen: 'tx', txSel: a.id })
  }));
  const tx = activity.find((a) => a.id === S.txSel) || activity[0];
  const txRows = rows([
    { k: 'Status', v: tx.status, ink: tx.stInk },
    { k: 'Details', v: tx.sub },
    { k: 'Gebühr', v: tx.fee },
    { k: 'Zeit', v: (tx.day === 'HEUTE' ? 'Heute' : 'Gestern') + ', ' + tx.time },
    { k: 'Tx-Hash', v: '0x8f3a…c21d' }
  ]);

  const navLabels: Record<Tab, string> = { home: 'Portfolio', markets: 'Märkte', activity: 'Aktivität', settings: 'Einstellungen' };
  const nav = TABS.map((k) => ({
    label: navLabels[k], icon: <Icon name={k} color={S.tab === k ? IND : MUT} />, ink: S.tab === k ? ACC : MUT, onClick: () => setState({ screen: k, tab: k })
  }));

  return {
    screen: scr, back, lockNow, testnet: P.testnet, privacyBlur: P.privacyMode ? 'blur(10px)' : 'none', toast: S.toast,

    // onboarding
    startCreate: () => setState({ screen: 'warn', flow: 'create', checks: [false, false, false], seedShown: false, picks: {} }),
    startImport: () => setState({ screen: 'import', flow: 'import', importText: '' }),
    warnRows, warnOk, warnNext: () => warnOk && setState({ screen: 'seed' }),
    seedWords, seedShown: S.seedShown, revealSeed: set({ seedShown: true }),
    seedNext: () => S.seedShown && setState({ screen: 'verify', picks: {} }),
    verifyRows, verifyOk, verifyNext: () => verifyOk && setState({ screen: 'pin', pinMode: 'set', pin: '', pinFirst: '', pinError: '' }),
    importText: S.importText, onImport: (ev: ChangeEvent<HTMLTextAreaElement>) => setState({ importText: ev.target.value }),
    importMsg, importInk: bad ? NEG : importValid ? POS : MUT, importSugg, importValid,
    importDemo: set({ importText: SEED.join(' ') }),
    importNext: () => importValid && setState({ screen: 'pin', pinMode: 'set', pin: '', pinFirst: '', pinError: '' }),
    pinTitle: pinTitles[S.pinMode], pinSub: pinSubs[S.pinMode], pinDots, pinKeys, pinError: S.pinError, pinCanBack: S.pinMode !== 'unlock',
    pwA: S.pwA, pwB: S.pwB, pwVisible: S.pwVisible, pwMsg, pwMsgInk, pwValid,
    onPwA: (ev: ChangeEvent<HTMLInputElement>) => setState({ pwA: ev.target.value }),
    onPwB: (ev: ChangeEvent<HTMLInputElement>) => setState({ pwB: ev.target.value }),
    togglePwVisible: set({ pwVisible: !S.pwVisible }),
    savePassword: () => {
      if (!pwValid) return;
      setState({ password: S.pwA, pwA: '', pwB: '', pwVisible: false, screen: 'home', tab: 'home' });
      flash(S.flow === 'import' ? 'Konten abgeleitet · Bitcoin-Scan abgeschlossen' : 'Wallet bereit');
    },

    // home
    total: fiat(totalEur), totalDelta: pc(hPct), totalDeltaInk: hPct < 0 ? NEG : ACC,
    totalAbs: (hPct < 0 ? '−' : '+') + fiat(Math.abs((totalEur * hPct) / 100)), hRangeLabel: S.hRange === '24H' ? '24 Std.' : S.hRange,
    hChart, hRanges, actions, netChips, holdings,
    goScan: () => startSend(), goSwap: () => startSwap(), goHome: () => setState({ screen: 'home', tab: 'home' }),

    // markets / coin
    mSearch: S.mSearch, onSearch: (ev: ChangeEvent<HTMLInputElement>) => setState({ mSearch: ev.target.value }), mTabs, coins,
    coinsEmptyText: S.mTab === 'Watchlist' && !q ? 'Noch keine Favoriten. Markiere Coins in der Detailansicht mit dem Stern.' : 'Keine Treffer.',
    coin: { ...C, price: fiat(C.price) }, cChart,
    cChartDelta: pc(cd[2]), cChartInk: cd[2] < 0 ? NEG : ACC, cRangeLabel: 'Zeitraum ' + S.cRange + ' · Live',
    cRanges: (Object.keys(cDefs) as CRange[]).map((r) => ({ label: r, ...rangeBtn(r === S.cRange), onClick: set({ cRange: r }) })),
    coinStats: [{ k: 'MARKTKAP.', v: C.cap }, { k: 'VOLUMEN 24H', v: C.vol }, { k: 'HOCH 24H', v: fiat(C.hi) }, { k: 'TIEF 24H', v: fiat(C.lo) }],
    starIcon: <StarIcon color={inWatch ? WARN : INK} filled={inWatch} />,
    toggleWatch: () => { setState((s) => ({ watch: inWatch ? s.watch.filter((x) => x !== C.id) : s.watch.concat(C.id) })); flash(inWatch ? 'Aus Watchlist entfernt' : 'Zur Watchlist hinzugefügt'); },
    coinSupported: C.supported !== false,
    coinReceive: () => startRecv(C.sym),
    coinSend: () => (coinAsset ? startSend(coinAsset) : flash('Kein ' + C.sym + '-Guthaben vorhanden')),
    coinSwap: () => (coinAsset && SWAPPABLE.includes(coinAsset) ? startSwap(coinAsset) : flash(C.sym === 'BTC' ? 'Bitcoin-Swaps folgen in einer späteren Version' : 'Kein ' + C.sym + '-Guthaben vorhanden')),

    // receive
    rcvAssets: Object.keys(RCV).map((s) => ({ label: s, ...chip(S.rcvAsset === s), onClick: set({ rcvAsset: s, rcvNet: RCV[s][0] }) })),
    rcvNets: rNets.map((n) => ({ label: n, bg: n === rNet ? 'rgba(108,92,231,.18)' : '#141418', ink: n === rNet ? ACC : MUT, onClick: set({ rcvNet: n }) })),
    qr: qrCells(rAddr), rcvAddr: rAddr.match(/.{1,4}/g)!.join(' '),
    rcvNote: rFam === 'btc' ? 'Native SegWit · nach Nutzung neue Adresse' : rFam === 'evm' ? 'Gleiche Adresse auf allen EVM-Netzen' : 'Solana-Adresse',
    rcvWarn: 'Sende nur ' + S.rcvAsset + ' über ' + rNet + ' an diese Adresse. Andere Netzwerke können zum Verlust führen.',
    copyAddr: () => flash('Adresse kopiert'), shareAddr: () => flash('Teilen geöffnet'),

    // send
    sendAssets: ASSETS.map((a) => ({ ...holdRow(a), onClick: () => startSend(a.id) })),
    sendHead: sA.sym + ' über ' + sA.net, sTo: S.sTo, onTo: (ev: ChangeEvent<HTMLTextAreaElement>) => setState({ sTo: ev.target.value.replace(/\s/g, '') }),
    toPlaceholder: sFam === 'evm' ? '0x… Adresse' : sFam === 'sol' ? 'Solana-Adresse' : 'bc1… Adresse',
    pasteTo: set({ sTo: POISON[sFam] }), scanTo: () => { setState({ sTo: FRESH[sFam] }); flash('QR-Code erkannt'); },
    toMsg, recents: [{ short: short(RECENT[sFam]), note: 'Zuletzt am 12. Sep', onClick: set({ sTo: RECENT[sFam] }) }],
    toValid, toNext: () => toValid && setState({ screen: 'sendAmt' }),
    toShort: short(S.sTo.trim()),
    amtMain: S.sAmt || '0', amtUnit: S.sFiat && canFiat ? cur : sA.sym,
    amtAlt: S.sFiat && canFiat ? nf(tokenAmt, sA.dec) + ' ' + sA.sym : fiat(tokenFiat),
    toggleFiat: () => canFiat && setState({ sFiat: !S.sFiat, sAmt: '' }),
    setMax: () => {
      const m = Math.max(0, native ? sA.bal - fee.eur / sA.price! : sA.bal);
      setState({ sFiat: false, sAmt: m.toFixed(sA.dec).replace('.', ',') });
    },
    amtInfo, amtInfoInk: over ? NEG : MUT, amtKeys, feeOpts, amtValid,
    amtNext: () => amtValid && setState({ screen: 'sendReview' }),
    revAmount: nf(tokenAmt, sA.dec) + ' ' + sA.sym, revFiat: canFiat ? fiat(tokenFiat) : 'Kein Marktpreis', revRows, revWarns, confirmCta,
    sendConfirm: () => openConfirm(() => startStatus({
      title: 'Wird gesendet', doneTitle: 'Gesendet', sub: nf(tokenAmt, sA.dec) + ' ' + sA.sym + ' an ' + short(S.sTo.trim()),
      rows: [{ k: 'Netzwerk', v: sA.net }, { k: 'Gebühr', v: fiat(fee.eur) }, { k: 'Tx-Hash', v: '0x8f3a…c21d' }],
      t: 'send', actTitle: 'Gesendet', actSub: sA.net + ' · ' + short(S.sTo.trim()), actAmt: '−' + nf(tokenAmt, sA.dec) + ' ' + sA.sym, pendingStatus: 'Ausstehend', fee: fiat(fee.eur)
    })),

    // swap
    slipLabel: nf(S.slip, 1) + ' %', openSlip: set({ slipOpen: true }), closeSlip: set({ slipOpen: false }), slipOpen: S.slipOpen, slipOpts, slipWarn: S.slip > 1,
    swF: { ...F, balLabel: nf(F.bal, F.dec) }, swT: T, swAmt: nf(swAmtN, F.dec), swAmtFiat: fiat(swAmtN * F.price!), swOut: nf(outN, T.dec),
    quoteLeft: 'Quote ' + S.quoteT + ' s', quoteBar: (S.quoteT / 30) * 100, quoteRows, impactWarn: impact > 3, pctChips,
    cycleFrom: set({ swFrom: cycle(S.swFrom, S.swTo), quoteT: 30 }), cycleTo: set({ swTo: cycle(S.swTo, S.swFrom), quoteT: 30 }),
    flipSwap: set({ swFrom: S.swTo, swTo: S.swFrom, quoteT: 30 }),
    swapNext: set({ screen: 'swapReview' }), swapSteps, swapRevRows,
    swapConfirm: () => openConfirm(() => startStatus({
      title: cross ? 'Swap unterwegs' : 'Swap läuft', doneTitle: cross ? 'Angekommen' : 'Swap abgeschlossen',
      sub: nf(swAmtN, F.dec) + ' ' + F.sym + ' → ' + nf(outN, T.dec) + ' ' + T.sym,
      rows: [{ k: 'Route', v: route }, { k: 'Mindestempfang', v: nf(minOut, T.dec) + ' ' + T.sym }, { k: 'Gebühr', v: fiat(swFee) }],
      t: 'swap', actTitle: F.sym + ' → ' + T.sym, actSub: route, actAmt: '+' + nf(outN, T.dec) + ' ' + T.sym, pendingStatus: cross ? 'Unterwegs' : 'Ausstehend', fee: fiat(swFee)
    })),

    // status / activity / tx
    stDone, stTitle: st ? (stDone ? st.doneTitle : st.title) : '', stSub: st?.sub || '', stRows: rows(st?.rows || []),
    openExplorer: () => flash('Explorer im Browser geöffnet'),
    activity, tx, txRows,

    // settings
    currency: cur, cycleCur: () => { const k = Object.keys(RATES) as Currency[]; setState({ currency: k[(k.indexOf(cur) + 1) % k.length] }); },
    goRpc: set({ screen: 'rpc' }), rpcs: RPCS.map(([net, url], i) => ({ net, url, fb: i === 7 ? '+1 Fallback' : '+2 Fallbacks', divider: div(i) })),
    addRpc: () => flash('Nur HTTPS-Endpunkte werden akzeptiert'),
    tokensInfo: () => flash('Token per Vertragsadresse hinzufügen'),
    changePin: () => flash('Alte PIN prüfen, dann neue festlegen'),
    changePassword: () => flash('Altes Passwort prüfen, dann neues festlegen'),
    autoLockLabel: S.autoLock + ' min', cycleLock: () => { const o = [1, 5, 15]; setState({ autoLock: o[(o.indexOf(S.autoLock) + 1) % o.length] }); },
    revealPhrase: () => setState({ screen: 'pin', pinMode: 'reveal', pin: '', pinError: '' }),
    privacyInfo: () => flash('Keine Analytics, kein Tracking, keine Crash-Reports'),
    resetOpen: S.resetOpen, openReset: set({ resetOpen: true, resetChk: false }), closeReset: set({ resetOpen: false }),
    resetChk: S.resetChk, toggleResetChk: set({ resetChk: !S.resetChk }),
    doReset: () => S.resetChk && setState({ resetOpen: false, screen: 'welcome', pinFirst: '', pinMode: 'set', checks: [false, false, false], seedShown: false, picks: {} }),

    // overlays / chrome
    confirmOpen: S.confirmOpen, runConfirm, pwEntry: S.pwEntry, pwError: S.pwError,
    onPwEntry: (ev: ChangeEvent<HTMLInputElement>) => setState({ pwEntry: ev.target.value, pwError: '' }),
    closeConfirm: set({ confirmOpen: false, pwEntry: '', pwError: '' }),
    showDock: (TABS as Screen[]).includes(scr), navLeft: nav.slice(0, 2), navRight: nav.slice(2)
  };
}

export type Wallet = ReturnType<typeof useWallet>;
