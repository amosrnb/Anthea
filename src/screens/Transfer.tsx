import { ACC, IND } from '../data';
import type { Wallet } from '../useWallet';
import { Chip, f, Header, HeaderTitle, KvRows, Mark, MUTED, Notice, Overline, PrimaryCta, TNUM } from '../ui';

const WHITE = '#F7F7F5';

const TwoLineTitle = ({ title, sub }: { title: string; sub: string }) => (
  <span style={{ display: 'flex', flexDirection: 'column' }}>
    <HeaderTitle>{title}</HeaderTitle>
    <span style={{ font: f(800, 12), color: MUTED }}>{sub}</span>
  </span>
);

export function Receive({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back} padding="16px 18px 6px"><HeaderTitle>Empfangen</HeaderTitle></Header>
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0', overflowX: 'auto', flex: 'none' }}>
        {w.rcvAssets.map((a) => <Chip key={a.label} {...a} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px 0', overflowX: 'auto', flex: 'none' }}>
        <span style={{ flex: 'none', font: f(800, 11), letterSpacing: '1.1px', color: MUTED, paddingRight: 4 }}>NETZWERK</span>
        {w.rcvNets.map((n) => <Chip key={n.label} {...n} style={{ borderRadius: 11, padding: '6px 11px', font: f(800, 12) }} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 22px 0' }}>
        <div style={{ width: 220, height: 220, background: WHITE, borderRadius: 24, padding: 13, boxSizing: 'border-box', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(29,1fr)', width: '100%', height: '100%' }} role="img" aria-label="QR-Code der Adresse">
            {w.qr.map((c, i) => <span key={i} style={{ background: c }} />)}
          </div>
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 48, height: 48, borderRadius: 16, background: IND, border: `5px solid ${WHITE}` }} />
        </div>
        <div style={{ marginTop: 18, maxWidth: 300, textAlign: 'center', font: f(800, 16, 1.5), letterSpacing: '.6px', wordBreak: 'break-all', ...TNUM }}>{w.rcvAddr}</div>
        <div style={{ marginTop: 6, font: f(800, 12.5), color: MUTED }}>{w.rcvNote}</div>
      </div>
      <div style={{ margin: '18px 16px 0', display: 'flex', gap: 11, alignItems: 'flex-start', borderRadius: 18, background: 'rgba(232,196,106,.1)', padding: '14px 16px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8C46A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17v.5" /></svg>
        <span style={{ font: f(800, 13.5, 1.45), color: '#F2DDA4' }}>{w.rcvWarn}</span>
      </div>
      <div className="cta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="btn btn--secondary" onClick={w.copyAddr} style={{ height: 58, font: f(800, 15.5) }}>Kopieren</button>
        <button className="btn btn--primary" onClick={w.shareAddr} style={{ height: 58, font: f(900, 15.5) }}>Teilen</button>
      </div>
    </div>
  );
}

export function SendAsset({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back} padding="16px 18px 6px"><HeaderTitle>Was möchtest du senden?</HeaderTitle></Header>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 16px 30px' }}>
        {w.sendAssets.map((h) => (
          <button key={h.id} className="row-btn row-btn--hover" onClick={h.onClick} style={{ gap: 13, padding: '13px 4px' }}>
            <Mark size={42} radius={15} fontSize={15} bg={h.bg} ink={h.ink}>{h.mark}</Mark>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ font: f(800, 15.5), color: WHITE }}>{h.sym}</span>
                <span style={{ font: f(800, 9.5), letterSpacing: '.5px', color: h.tagInk, background: h.tagBg, borderRadius: 6, padding: '3px 6px' }}>{h.tag}</span>
              </span>
              <span style={{ display: 'block', font: f(800, 12.5), color: MUTED, marginTop: 4 }}>{h.sub}</span>
            </span>
            <span style={{ font: f(800, 15), color: WHITE, ...TNUM }}>{h.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const Pill = ({ onClick, children }: { onClick: () => void; children: string }) => (
  <button onClick={onClick} style={{ border: 0, borderRadius: 12, padding: '8px 13px', background: '#1E1E23', color: WHITE, font: f(800, 13), cursor: 'pointer' }}>{children}</button>
);

export function SendTo({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back} padding="16px 18px 6px"><TwoLineTitle title="Empfänger" sub={w.sendHead} /></Header>
      <div style={{ margin: '14px 16px 0', borderRadius: 20, background: '#141418', padding: '14px 16px' }}>
        <textarea value={w.sTo} onChange={w.onTo} placeholder={w.toPlaceholder} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          style={{ width: '100%', boxSizing: 'border-box', height: 52, resize: 'none', border: 0, outline: 0, background: 'transparent', color: WHITE, font: f(800, 15, 1.45), wordBreak: 'break-all' }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <Pill onClick={w.pasteTo}>Einfügen</Pill>
          <Pill onClick={w.scanTo}>QR scannen</Pill>
        </div>
      </div>
      {w.toMsg && <Notice bg={w.toMsg.bg} ink={w.toMsg.ink} style={{ margin: '10px 16px 0' }}>{w.toMsg.text}</Notice>}
      <Overline style={{ padding: '22px 20px 8px' }}>ZULETZT VERWENDET</Overline>
      <div style={{ padding: '0 16px' }}>
        {w.recents.map((r) => (
          <button key={r.short} className="row-btn" onClick={r.onClick} style={{ gap: 12, padding: '10px 4px' }}>
            <span style={{ width: 38, height: 38, borderRadius: 13, background: '#1E1E23' }} />
            <span>
              <span style={{ display: 'block', font: f(800, 15), color: WHITE }}>{r.short}</span>
              <span style={{ display: 'block', marginTop: 3, font: f(800, 12), color: MUTED }}>{r.note}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="cta"><PrimaryCta onClick={w.toNext} enabled={w.toValid}>Weiter</PrimaryCta></div>
    </div>
  );
}

export function SendAmount({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back}><TwoLineTitle title="Betrag" sub={'An ' + w.toShort} /></Header>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ font: f(900, 44, 1), letterSpacing: '.5px', ...TNUM }}>{w.amtMain}</span>
          <span style={{ font: f(900, 20), color: MUTED }}>{w.amtUnit}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button onClick={w.toggleFiat} style={{ border: 0, borderRadius: 11, padding: '6px 11px', background: '#1E1E23', color: WHITE, font: f(800, 12.5), cursor: 'pointer' }}>≈ {w.amtAlt}</button>
          <button onClick={w.setMax} style={{ border: 0, borderRadius: 11, padding: '6px 11px', background: 'rgba(108,92,231,.14)', color: ACC, font: f(800, 12.5), cursor: 'pointer' }}>Max</button>
        </div>
        <div style={{ marginTop: 10, font: f(800, 12), color: w.amtInfoInk }}>{w.amtInfo}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '16px 16px 0' }}>
        {w.feeOpts.map((o) => (
          <button key={o.label} onClick={o.onClick} style={{ border: `2px solid ${o.ring}`, borderRadius: 18, background: '#141418', padding: '10px 8px', cursor: 'pointer', textAlign: 'center', fontFamily: "'Nunito',sans-serif" }}>
            <span style={{ display: 'block', font: f(800, 13), color: WHITE }}>{o.label}</span>
            <span style={{ display: 'block', marginTop: 3, font: f(800, 12), color: ACC, ...TNUM }}>{o.cost}</span>
            <span style={{ display: 'block', marginTop: 2, font: f(800, 11), color: MUTED }}>{o.time}</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '4px 10px', padding: '8px 30px 10px' }}>
        {w.amtKeys.map((k, i) => (
          <button key={i} className="key key--amt" onClick={k.onClick} aria-label={k.label || 'Löschen'}
            style={{ ['--bg' as string]: 'transparent', height: 50, border: 0, borderRadius: 16, color: WHITE, font: f(900, 24), cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            {k.label}{k.icon}
          </button>
        ))}
      </div>
      <div style={{ padding: '0 16px 30px' }}><PrimaryCta onClick={w.amtNext} enabled={w.amtValid}>Prüfen</PrimaryCta></div>
    </div>
  );
}

export function SendReview({ w }: { w: Wallet }) {
  return (
    <div className="screen">
      <Header onBack={w.back}><HeaderTitle>Prüfen</HeaderTitle></Header>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 20px 6px' }}>
        <div style={{ font: f(900, 36), letterSpacing: '.4px', ...TNUM }}>{w.revAmount}</div>
        <div style={{ marginTop: 6, font: f(800, 13), color: MUTED }}>{w.revFiat}</div>
      </div>
      <div style={{ margin: '12px 16px 0' }}><KvRows rows={w.revRows} pad="12px 4px" breakAll /></div>
      {w.revWarns.map((n) => <Notice key={n.text} bg={n.bg} ink={n.ink} style={{ margin: '8px 16px 0' }}>{n.text}</Notice>)}
      <div className="cta"><PrimaryCta onClick={w.sendConfirm}>{w.confirmCta}</PrimaryCta></div>
    </div>
  );
}
