import { NEG, POS } from '../data';
import { Icon } from '../icons';
import type { Wallet } from '../useWallet';
import { DIM, f, Header, HeaderTitle, KvRows, MUTED, Overline, PrimaryCta, TNUM } from '../ui';

const PageTitle = ({ children, pad }: { children: string; pad: string }) => (
  <div style={{ padding: pad, font: f(900, 28), letterSpacing: '-.7px' }}>{children}</div>
);

export function Activity({ w }: { w: Wallet }) {
  return (
    <div className="scroll">
      <PageTitle pad="22px 20px 4px">Aktivität</PageTitle>
      <div style={{ margin: '0 16px 130px' }}>
        {w.activity.map((a) => (
          <div key={a.id}>
            {a.showHeader && <Overline style={{ padding: '18px 4px 6px' }}>{a.day}</Overline>}
            <button className="row-btn row-btn--hover" onClick={a.onClick} style={{ gap: 13, padding: '12px 4px' }}>
              <span style={{ flex: 'none', width: 42, height: 42, borderRadius: '50%', background: '#141418', display: 'grid', placeItems: 'center' }}>{a.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', font: f(800, 15), color: '#F7F7F5' }}>{a.title}</span>
                <span style={{ display: 'block', marginTop: 3, font: f(800, 12), color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.sub}</span>
              </span>
              <span style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', font: f(800, 14.5), color: a.amtInk, ...TNUM }}>{a.amt}</span>
                <span style={{ display: 'inline-block', marginTop: 4, font: f(800, 10.5), color: a.stInk, background: a.stBg, borderRadius: 6, padding: '2px 6px' }}>{a.status}</span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TxDetail({ w }: { w: Wallet }) {
  const tx = w.tx;
  return (
    <div className="screen">
      <Header onBack={w.back}><HeaderTitle>Transaktion</HeaderTitle></Header>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 20px 10px' }}>
        <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#141418', display: 'grid', placeItems: 'center' }}>{tx.icon}</span>
        <div style={{ marginTop: 16, font: f(900, 30), letterSpacing: '.3px', color: tx.amtInk, ...TNUM }}>{tx.amt}</div>
        <div style={{ marginTop: 6, font: f(800, 13.5), color: MUTED }}>{tx.title}</div>
      </div>
      <div style={{ margin: '10px 16px 0' }}><KvRows rows={w.txRows} pad="12px 4px" numeric={false} /></div>
      <div className="cta">
        <button className="btn btn--secondary" onClick={w.openExplorer} style={{ height: 58, font: f(800, 15.5) }}>Im Explorer ansehen</button>
      </div>
    </div>
  );
}

const Group = ({ label, first, children }: { label: string; first?: boolean; children: React.ReactNode }) => (
  <>
    <Overline style={{ padding: first ? '14px 20px 6px' : '20px 20px 6px' }}>{label}</Overline>
    <div style={{ margin: '0 16px', borderRadius: 22, background: '#0E0E11', overflow: 'hidden' }}>{children}</div>
  </>
);

const Item = ({ label, value, onClick }: { label: string; value: React.ReactNode; onClick: () => void }) => (
  <button className="settings-row" onClick={onClick}>{label}<span>{value}</span></button>
);

export function Settings({ w }: { w: Wallet }) {
  return (
    <div className="scroll" style={{ paddingBottom: 120 }}>
      <PageTitle pad="22px 20px 8px">Einstellungen</PageTitle>
      <Group label="ALLGEMEIN" first>
        <Item label="Währung" value={w.currency} onClick={w.cycleCur} />
        <Item label="Netzwerke & RPC" value="8 aktiv" onClick={w.goRpc} />
        <Item label="Token verwalten" value="Leere ausgeblendet" onClick={w.tokensInfo} />
      </Group>
      <Group label="SICHERHEIT">
        <Item label="PIN ändern" value="6 Ziffern" onClick={w.changePin} />
        <Item label="Auto-Sperre" value={w.autoLockLabel} onClick={w.cycleLock} />
        <Item label="Jetzt sperren" value="›" onClick={w.lockNow} />
      </Group>
      <Group label="BACKUP">
        <Item label="Wiederherstellungsphrase anzeigen" value="PIN" onClick={w.revealPhrase} />
      </Group>
      <Group label="ÜBER">
        <Item label="Datenschutz" value="Kein Tracking" onClick={w.privacyInfo} />
        <div className="settings-row" style={{ width: 'auto', cursor: 'default' }}>Version<span>0.1 (MVP)</span></div>
      </Group>
      <div style={{ padding: '22px 16px 0' }}>
        <button onClick={w.openReset} style={{ width: '100%', height: 54, border: 0, borderRadius: 20, background: 'rgba(255,143,128,.1)', color: NEG, font: f(900, 15), cursor: 'pointer' }}>Wallet zurücksetzen</button>
      </div>
    </div>
  );
}

export function Rpc({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back}><HeaderTitle>Netzwerke &amp; RPC</HeaderTitle></Header>
      <p style={{ margin: '16px 20px 6px', font: f(700, 13, 1.55), color: MUTED }}>Anbieter sehen deine IP-Adresse und abgefragte Adressen. Eigene Endpunkte verbessern die Privatsphäre. Nur HTTPS.</p>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', margin: '6px 16px 0' }}>
        {w.rpcs.map((r) => (
          <div key={r.net} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderTop: `1px solid ${r.divider}` }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: POS }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', font: f(800, 15) }}>{r.net}</span>
              <span style={{ display: 'block', marginTop: 3, font: f(800, 12), color: MUTED }}>{r.url}</span>
            </span>
            <span style={{ font: f(800, 11.5), color: MUTED }}>{r.fb}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 16px 34px' }}>
        <button className="btn btn--secondary" onClick={w.addRpc} style={{ height: 56, font: f(800, 15.5) }}>Eigenen Endpunkt hinzufügen</button>
      </div>
    </div>
  );
}

export function Reveal({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back}><HeaderTitle>Wiederherstellungsphrase</HeaderTitle></Header>
      <div style={{ margin: '16px 16px 0', borderRadius: 18, background: 'rgba(255,143,128,.1)', padding: '14px 16px', font: f(800, 13.5, 1.45), color: '#FFB9AE' }}>
        Wer die Wörter kennt, besitzt das Geld. Zeige sie niemandem, auch nicht dem Support.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 16px 0' }}>
        {w.seedWords.map((s) => (
          <span key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 14, background: '#141418' }}>
            <span style={{ width: 18, font: f(800, 12), color: DIM }}>{s.n}</span>
            <span style={{ font: f(900, 15.5), userSelect: 'none' }}>{s.w}</span>
          </span>
        ))}
      </div>
      <div style={{ padding: '12px 20px 0', font: f(800, 12), color: '#A79BFF' }}>Screenshots blockiert · Kopieren deaktiviert</div>
      <div className="cta"><PrimaryCta onClick={w.back}>Fertig</PrimaryCta></div>
    </div>
  );
}

export const CheckBoxMark = () => <Icon name="check" color="#FFFFFF" size={14} weight={3} />;
