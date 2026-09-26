import { ACC, IND } from '../data';
import { Icon } from '../icons';
import type { Wallet } from '../useWallet';
import { f, Header, HeaderTitle, KvRows, Mark, MUTED, Overline, PrimaryCta, Sheet, TNUM } from '../ui';

const WARN_BOX = { borderRadius: 16, background: 'rgba(232,196,106,.1)', padding: '11px 14px', font: f(800, 12.5, 1.45), color: '#F2DDA4' };

type SwapSide = Wallet['swT'];

const TokenPill = ({ t, onClick }: { t: SwapSide; onClick: () => void }) => (
  <button onClick={onClick} style={{ border: 0, display: 'flex', alignItems: 'center', gap: 8, background: '#1E1E23', borderRadius: 16, padding: '7px 12px 7px 7px', cursor: 'pointer', color: '#F7F7F5' }}>
    <Mark size={26} radius={9} fontSize={12} bg={t.bg} ink={t.ink}>{t.mark}</Mark>
    <span style={{ textAlign: 'left' }}>
      <span style={{ display: 'block', font: f(800, 14) }}>{t.sym}</span>
      <span style={{ display: 'block', font: f(800, 10.5), color: MUTED }}>{t.net}</span>
    </span>
  </button>
);

const Card = ({ children }: { children: React.ReactNode }) => <div style={{ borderRadius: 24, background: '#0E0E11', padding: '16px 18px' }}>{children}</div>;
const CardHead = ({ left, right }: { left: string; right: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <Overline>{left}</Overline>
    <span style={{ font: f(800, 11.5), color: MUTED }}>{right}</span>
  </div>
);
const Amount = ({ value, color }: { value: string; color?: string }) => (
  <span style={{ flex: 1, font: f(900, 32), letterSpacing: '.4px', ...TNUM, color }}>{value}</span>
);

export function Swap({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
        <span style={{ font: f(900, 22), letterSpacing: '-.6px', paddingLeft: 4 }}>Swappen</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={w.openSlip} style={{ width: 'auto', padding: '0 13px', color: '#F7F7F5', font: f(800, 13) }}>Slippage {w.slipLabel}</button>
          <button className="icon-btn" onClick={w.back} aria-label="Schließen">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="rgba(247,247,245,.7)" strokeWidth="2.1" strokeLinecap="round"><path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" /></svg>
          </button>
        </span>
      </div>

      <div style={{ position: 'relative', margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Card>
          <CardHead left="DU ZAHLST" right={'Guthaben ' + w.swF.balLabel} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <Amount value={w.swAmt} />
            <TokenPill t={w.swF} onClick={w.cycleFrom} />
          </div>
          <div style={{ marginTop: 6, font: f(800, 12.5), color: MUTED }}>{w.swAmtFiat}</div>
        </Card>
        <button onClick={w.flipSwap} aria-label="Richtung tauschen"
          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 3, width: 44, height: 44, borderRadius: 16, background: '#1E1E23', border: '4px solid #000000', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
          <Icon name="swap" color={ACC} size={17} weight={2.4} />
        </button>
        <Card>
          <CardHead left="DU ERHÄLTST (ERWARTET)" right={w.quoteLeft} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <Amount value={w.swOut} color={ACC} />
            <TokenPill t={w.swT} onClick={w.cycleTo} />
          </div>
          <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: '#1E1E23', overflow: 'hidden' }}>
            <div style={{ height: 3, background: IND, width: w.quoteBar + '%' }} />
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '12px 16px 0' }}>
        {w.pctChips.map((p) => (
          <button key={p.label} onClick={p.onClick} style={{ border: 0, height: 36, borderRadius: 12, background: p.bg, color: p.ink, cursor: 'pointer', font: f(800, 12.5) }}>{p.label}</button>
        ))}
      </div>
      <div style={{ margin: '10px 16px 0' }}><KvRows rows={w.quoteRows} pad="9px 4px" size={13} /></div>
      {w.impactWarn && <div style={{ margin: '6px 16px 0', ...WARN_BOX }}>Hohe Preisauswirkung über 3 %. Prüfe Betrag und Route.</div>}
      <div className="cta" style={{ paddingTop: 12 }}><PrimaryCta onClick={w.swapNext}>Swap prüfen</PrimaryCta></div>

      {w.slipOpen && (
        <Sheet onClose={w.closeSlip} scrim={0.55} z={25}>
          <h3 style={{ margin: '16px 4px 4px', font: f(900, 21) }}>Slippage-Toleranz</h3>
          <p style={{ margin: '0 4px', font: f(700, 13.5, 1.5), color: MUTED }}>Fällt der Kurs weiter, wird der Swap abgebrochen.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 16 }}>
            {w.slipOpts.map((s) => (
              <button key={s.label} onClick={s.onClick} style={{ border: 0, height: 46, borderRadius: 15, background: s.bg, color: s.ink, font: f(900, 14.5), cursor: 'pointer' }}>{s.label}</button>
            ))}
          </div>
          {w.slipWarn && <div style={{ marginTop: 12, ...WARN_BOX, borderRadius: 14 }}>Über 1 % steigt das Risiko einer schlechten Ausführung.</div>}
          <PrimaryCta onClick={w.closeSlip} style={{ marginTop: 16, height: 54, borderRadius: 20, font: f(900, 15.5) }}>Übernehmen</PrimaryCta>
        </Sheet>
      )}
    </div>
  );
}

export function SwapReview({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back}><HeaderTitle>Swap prüfen</HeaderTitle></Header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 16px 0' }}>
        {w.swapSteps.map((s) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 13, borderRadius: 20, background: '#141418', padding: '14px 16px' }}>
            <span style={{ flex: 'none', width: 30, height: 30, borderRadius: '50%', background: IND, color: '#FFFFFF', display: 'grid', placeItems: 'center', font: f(900, 13) }}>{s.n}</span>
            <span>
              <span style={{ display: 'block', font: f(800, 15) }}>{s.title}</span>
              <span style={{ display: 'block', marginTop: 3, font: f(800, 12), color: MUTED }}>{s.sub}</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ margin: '10px 16px 0' }}><KvRows rows={w.swapRevRows} pad="11px 4px" /></div>
      <div className="cta"><PrimaryCta onClick={w.swapConfirm}>{w.confirmCta}</PrimaryCta></div>
    </div>
  );
}

export function Status({ w }: { w: Wallet }) {
  return (
    <div className="screen" style={{ alignItems: 'center', padding: '90px 22px 0', textAlign: 'center' }}>
      <span style={{ width: 96, height: 96, borderRadius: '50%', background: w.stDone ? IND : '#141418', display: 'grid', placeItems: 'center' }}>
        {w.stDone
          ? <Icon name="check" color="#FFFFFF" size={42} weight={3} />
          : <span style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid rgba(167,155,255,.25)', borderTopColor: ACC, animation: 'antheaSpin .9s linear infinite' }} />}
      </span>
      <h2 style={{ margin: '26px 0 0', font: f(900, 28), letterSpacing: '-.6px' }}>{w.stTitle}</h2>
      <p style={{ margin: '10px 0 0', font: f(700, 14.5, 1.5), color: MUTED, maxWidth: 300 }}>{w.stSub}</p>
      <div style={{ width: '100%', marginTop: 26, textAlign: 'left' }}><KvRows rows={w.stRows} pad="11px 4px" /></div>
      <div style={{ marginTop: 'auto', width: '100%', padding: '0 0 34px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn btn--secondary" onClick={w.openExplorer} style={{ height: 56, font: f(800, 15.5) }}>Im Explorer ansehen</button>
        <button className="btn btn--primary" onClick={w.goHome}>Fertig</button>
      </div>
    </div>
  );
}
