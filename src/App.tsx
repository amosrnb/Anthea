import type { ComponentType } from 'react';
import { IND, INK, NEG } from './data';
import { Icon } from './icons';
import { Activity, CheckBoxMark, Reveal, Rpc, Settings, TxDetail } from './screens/Account';
import { Import, PasswordField, Password, Pin, Seed, Verify, Warn, Welcome } from './screens/Onboarding';
import { CoinDetail, Home, Markets } from './screens/Portfolio';
import { Status, Swap, SwapReview } from './screens/Swap';
import { Receive, SendAmount, SendAsset, SendReview, SendTo } from './screens/Transfer';
import { useWallet, type Screen, type Wallet, type WalletProps } from './useWallet';
import { f, MUTED, Sheet } from './ui';

const SCREENS: Record<Screen, ComponentType<{ w: Wallet }>> = {
  welcome: Welcome, warn: Warn, seed: Seed, verify: Verify, import: Import, pin: Pin, password: Password,
  home: Home, markets: Markets, coin: CoinDetail, receive: Receive,
  sendAsset: SendAsset, sendTo: SendTo, sendAmt: SendAmount, sendReview: SendReview,
  swap: Swap, swapReview: SwapReview, status: Status,
  activity: Activity, tx: TxDetail, settings: Settings, rpc: Rpc, reveal: Reveal
};

function StatusBar() {
  return (
    <>
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 104, height: 30, borderRadius: 16, background: '#000000', zIndex: 40 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 26px 0', flex: 'none' }}>
        <span style={{ font: f(900, 15) }}>9:41</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="17" height="11" viewBox="0 0 17 11">
            <rect x="0" y="7" width="3" height="4" rx="1" fill={INK} />
            <rect x="4.5" y="5" width="3" height="6" rx="1" fill={INK} />
            <rect x="9" y="2.5" width="3" height="8.5" rx="1" fill={INK} />
            <rect x="13.5" y="0" width="3" height="11" rx="1" fill="rgba(247,247,245,.3)" />
          </svg>
          <span style={{ font: f(900, 10), background: INK, color: '#000000', borderRadius: 5, padding: '2px 5px' }}>100</span>
        </span>
      </div>
    </>
  );
}

function Dock({ w }: { w: Wallet }) {
  const item = (n: Wallet['navLeft'][number]) => (
    <button key={n.label} onClick={n.onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 0, padding: '6px 0', cursor: 'pointer', color: n.ink }}>
      {n.icon}<span style={{ font: f(800, 10) }}>{n.label}</span>
    </button>
  );
  return (
    <nav style={{ position: 'absolute', left: 18, right: 18, bottom: 24, height: 66, borderRadius: 26, background: 'rgba(19,19,22,.78)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', boxShadow: '0 18px 44px rgba(0,0,0,.55)', display: 'grid', gridTemplateColumns: '1fr 1fr 74px 1fr 1fr', alignItems: 'center', padding: '0 6px', zIndex: 10 }}>
      {w.navLeft.map(item)}
      <div style={{ display: 'grid', placeItems: 'center' }}>
        <button className="dock-swap" onClick={w.goSwap} aria-label="Swappen" style={{ width: 56, height: 56, borderRadius: 20, border: 0, background: IND, display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 10px 26px rgba(108,92,231,.32)' }}>
          <Icon name="swap" color="#FFFFFF" size={24} weight={2.6} />
        </button>
      </div>
      {w.navRight.map(item)}
    </nav>
  );
}

function ResetSheet({ w }: { w: Wallet }) {
  return (
    <Sheet onClose={w.closeReset} scrim={0.6} z={30}>
      <h3 style={{ margin: '16px 4px 6px', font: f(900, 21) }}>Wallet zurücksetzen?</h3>
      <p style={{ margin: '0 4px', font: f(700, 13.5, 1.5), color: MUTED }}>Alle Schlüssel und Daten werden von diesem Gerät gelöscht. Ohne Phrase ist dein Guthaben verloren. Anthea kann sie nicht wiederherstellen.</p>
      <button onClick={w.toggleResetChk} role="checkbox" aria-checked={w.resetChk}
        style={{ marginTop: 16, width: '100%', border: 0, display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, background: '#141418', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ flex: 'none', width: 24, height: 24, borderRadius: 8, background: w.resetChk ? NEG : '#2A2A32', display: 'grid', placeItems: 'center' }}>{w.resetChk && <CheckBoxMark />}</span>
        <span style={{ font: f(800, 14), color: INK }}>Ich habe meine Phrase gesichert</span>
      </button>
      <button onClick={w.doReset} style={{ marginTop: 12, width: '100%', height: 54, border: 0, borderRadius: 20, background: NEG, color: '#2A0D08', font: f(900, 15.5), cursor: 'pointer', opacity: w.resetChk ? 1 : 0.4 }}>Endgültig zurücksetzen</button>
    </Sheet>
  );
}

/** Password prompt shown before a transaction is signed. */
function ConfirmSheet({ w }: { w: Wallet }) {
  return (
    <Sheet onClose={w.closeConfirm} scrim={0.6} z={35}>
      <h3 style={{ margin: '16px 4px 4px', font: f(900, 21) }}>Passwort eingeben</h3>
      <p style={{ margin: '0 4px', font: f(700, 13.5, 1.5), color: MUTED }}>Signatur auf diesem Gerät</p>
      <form onSubmit={(ev) => { ev.preventDefault(); w.runConfirm(); }} style={{ marginTop: 16 }}>
        <PasswordField value={w.pwEntry} onChange={w.onPwEntry} placeholder="Passwort" autoFocus />
        <div role="alert" style={{ height: 18, margin: '8px 6px 0', font: f(800, 12.5), color: NEG }}>{w.pwError}</div>
        <button type="submit" className="btn btn--primary" style={{ marginTop: 8, height: 54, borderRadius: 20, font: f(900, 15.5), opacity: w.pwEntry ? 1 : 0.4 }}>Bestätigen</button>
      </form>
    </Sheet>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div role="status" style={{ position: 'absolute', left: 16, right: 16, bottom: 104, zIndex: 36, display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(30,30,35,.95)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderRadius: 20, padding: '14px 16px', boxShadow: '0 18px 44px rgba(0,0,0,.6)' }}>
      <span style={{ flex: 'none', width: 24, height: 24, borderRadius: 8, background: IND, display: 'grid', placeItems: 'center' }}>
        <svg width="12" height="9" viewBox="0 0 13 10" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round"><path d="M1.5 5 4.8 8.3 11.5 1.6" /></svg>
      </span>
      <span style={{ font: f(800, 14, 1.35) }}>{text}</span>
    </div>
  );
}

export default function App(props: WalletProps) {
  const w = useWallet(props);
  const Current = SCREENS[w.screen];
  return (
    <div className="device">
      <StatusBar />
      <Current w={w} />
      {w.showDock && <Dock w={w} />}
      {w.resetOpen && <ResetSheet w={w} />}
      {w.confirmOpen && <ConfirmSheet w={w} />}
      {w.toast && <Toast text={w.toast} />}
      <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, borderRadius: 3, background: 'rgba(247,247,245,.24)', zIndex: 40 }} />
    </div>
  );
}
