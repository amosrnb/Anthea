import { IND, POS } from '../data';
import { LockIcon } from '../icons';
import type { Wallet } from '../useWallet';
import { AreaChart, BackButton, Chip, f, Mark, MUTED, RangeTabs, TNUM } from '../ui';

const WHITE = '#F7F7F5';

export function Home({ w }: { w: Wallet }) {
  return (
    <div className="scroll">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 0' }}>
        <button className="icon-btn icon-btn--hover" onClick={w.goScan} aria-label="QR scannen">
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke={WHITE} strokeWidth="1.9" strokeLinecap="round"><path d="M1 6V2h4M17 6V2h-4M1 12v4h4M17 12v4h-4" /></svg>
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 8, background: IND }} />
          <span style={{ font: f(900, 17), letterSpacing: '-.2px' }}>Anthea</span>
          {w.testnet && <span style={{ font: f(900, 9.5), letterSpacing: '.8px', color: '#E8C46A', background: 'rgba(232,196,106,.14)', borderRadius: 6, padding: '3px 6px' }}>TESTNETZ</span>}
        </span>
        <button className="icon-btn icon-btn--hover" onClick={w.lockNow} aria-label="Sperren"><LockIcon size={17} color={WHITE} weight={2} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 22px 0' }}>
        <div style={{ font: f(800, 12), letterSpacing: '1.2px', color: MUTED }}>GESAMTWERT</div>
        <div style={{ font: f(900, 44, 1), letterSpacing: '.5px', ...TNUM, filter: w.privacyBlur }}>{w.total}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(108,92,231,.14)', borderRadius: 11, padding: '4px 9px', font: f(800, 12), ...TNUM, color: w.totalDeltaInk }}>{w.totalDelta}</span>
          <span style={{ font: f(800, 12.5), color: MUTED }}>{w.totalAbs} · {w.hRangeLabel}</span>
        </div>
      </div>

      <div style={{ padding: '14px 22px 0' }}>
        <AreaChart id="antheaFill" paths={w.hChart} viewH={64} height={64} opacity={0.28} />
        <RangeTabs ranges={w.hRanges} height={30} marginTop={12} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 34, padding: '22px 16px 0' }}>
        {w.actions.map((a) => (
          <button key={a.label} className="action-btn" onClick={a.onClick}>
            <span style={{ width: 58, height: 58, borderRadius: '50%', background: a.bg, display: 'grid', placeItems: 'center' }}>{a.icon}</span>
            <span style={{ font: f(800, 12.5), color: MUTED }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 7, padding: '24px 16px 8px', overflowX: 'auto' }}>
        {w.netChips.map((c) => <Chip key={c.label} {...c} />)}
      </div>

      <div style={{ margin: '0 16px 130px' }}>
        {w.holdings.map((h) => (
          <button key={h.id} className="row-btn row-btn--hover" onClick={h.onClick} style={{ gap: 13, padding: '13px 4px' }}>
            <Mark size={42} radius={15} fontSize={15} bg={h.bg} ink={h.ink}>{h.mark}</Mark>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ font: f(800, 15.5), color: WHITE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</span>
                <span style={{ flex: 'none', font: f(800, 9.5), letterSpacing: '.5px', color: h.tagInk, background: h.tagBg, borderRadius: 6, padding: '3px 6px' }}>{h.tag}</span>
              </span>
              <span style={{ display: 'block', font: f(800, 12.5), color: MUTED, marginTop: 4, ...TNUM }}>{h.sub}</span>
            </span>
            <span style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', font: f(800, 15.5), color: WHITE, ...TNUM, filter: w.privacyBlur }}>{h.value}</span>
              <span style={{ display: 'block', font: f(800, 12.5), color: h.chgInk, marginTop: 4, ...TNUM }}>{h.chg}</span>
            </span>
          </button>
        ))}
        <div style={{ padding: '14px 4px 0', font: f(700, 11.5), color: '#5E5E66' }}>Preise: CoinGecko, Fallback DefiLlama · Stand 09:41</div>
      </div>
    </div>
  );
}

export function Markets({ w }: { w: Wallet }) {
  return (
    <div className="scroll">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '22px 20px 0' }}>
        <span style={{ font: f(900, 28), letterSpacing: '-.7px' }}>Märkte</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: f(800, 12), color: MUTED }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: POS }} />Live · alle 30 s
        </span>
      </div>
      <div style={{ margin: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 10, height: 46, borderRadius: 16, background: '#141418', padding: '0 14px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
        <input value={w.mSearch} onChange={w.onSearch} placeholder="Coin suchen" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', color: WHITE, font: f(800, 15) }} />
      </div>
      <div style={{ display: 'flex', gap: 7, padding: '14px 16px 6px' }}>
        {w.mTabs.map((t) => <Chip key={t.label} {...t} />)}
      </div>
      <div style={{ margin: '0 16px 130px' }}>
        {w.coins.map((c) => (
          <button key={c.id} className="row-btn row-btn--hover" onClick={c.onClick} style={{ gap: 12, padding: '12px 4px' }}>
            <Mark size={40} radius={14} fontSize={14} bg={c.bg} ink={c.ink}>{c.mark}</Mark>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', font: f(800, 15), color: WHITE }}>{c.name}</span>
              <span style={{ display: 'block', marginTop: 3, font: f(800, 12), color: MUTED }}>{c.sym} · #{c.rank}</span>
            </span>
            <svg viewBox="0 0 64 24" style={{ width: 64, height: 24, flex: 'none' }}>
              <path d={c.spark} fill="none" stroke={c.chgInk} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ width: 92, textAlign: 'right' }}>
              <span style={{ display: 'block', font: f(800, 14.5), color: WHITE, ...TNUM }}>{c.price}</span>
              <span style={{ display: 'block', marginTop: 3, font: f(800, 12), color: c.chgInk, ...TNUM }}>{c.chg}</span>
            </span>
          </button>
        ))}
        {w.coins.length === 0 && <div style={{ padding: '40px 20px', textAlign: 'center', font: f(700, 14, 1.5), color: MUTED }}>{w.coinsEmptyText}</div>}
      </div>
    </div>
  );
}

const SmallBtn = ({ onClick, primary, children }: { onClick: () => void; primary?: boolean; children: string }) => (
  <button onClick={onClick} style={{ height: 54, border: 0, borderRadius: 20, background: primary ? IND : '#141418', color: primary ? '#FFFFFF' : WHITE, font: f(primary ? 900 : 800, 14.5), cursor: 'pointer' }}>{children}</button>
);

export function CoinDetail({ w }: { w: Wallet }) {
  const c = w.coin;
  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 0' }}>
        <BackButton onClick={w.back} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mark size={26} radius={9} fontSize={12} bg={c.bg} ink={c.ink}>{c.mark}</Mark>
          <span style={{ font: f(900, 17) }}>{c.name}</span>
        </span>
        <button className="icon-btn" onClick={w.toggleWatch} aria-label="Watchlist">{w.starIcon}</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '26px 22px 0' }}>
        <div style={{ font: f(900, 40, 1), letterSpacing: '.4px', ...TNUM }}>{c.price}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: 'rgba(108,92,231,.14)', borderRadius: 11, padding: '4px 9px', font: f(800, 12), color: w.cChartInk }}>{w.cChartDelta}</span>
          <span style={{ font: f(800, 12.5), color: MUTED }}>{w.cRangeLabel}</span>
        </div>
      </div>
      <div style={{ padding: '18px 22px 0' }}>
        <AreaChart id="antheaFill2" paths={w.cChart} viewH={120} height={150} opacity={0.26} />
        <RangeTabs ranges={w.cRanges} height={32} marginTop={14} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 16px', padding: '24px 26px 0' }}>
        {w.coinStats.map((s) => (
          <div key={s.k}>
            <div style={{ font: f(800, 11), letterSpacing: '1.1px', color: MUTED }}>{s.k}</div>
            <div style={{ marginTop: 6, font: f(800, 15), ...TNUM }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="cta">
        {w.coinSupported ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <SmallBtn onClick={w.coinReceive}>Empfangen</SmallBtn>
            <SmallBtn onClick={w.coinSend}>Senden</SmallBtn>
            <SmallBtn onClick={w.coinSwap} primary>Swappen</SmallBtn>
          </div>
        ) : (
          <div style={{ textAlign: 'center', font: f(700, 13), color: MUTED, padding: 16 }}>Dieses Netzwerk wird in Anthea nicht unterstützt.</div>
        )}
      </div>
    </div>
  );
}
