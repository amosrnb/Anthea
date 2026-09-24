import type { CSSProperties, ReactNode } from 'react';
import { BackIcon } from './icons';
import type { Row } from './useWallet';

/** `font` shorthand in Nunito: f(900, 15) → "900 15px 'Nunito',sans-serif". */
export const f = (weight: number, size: number, lineHeight?: number | string) =>
  `${weight} ${size}px${lineHeight != null ? '/' + lineHeight : ''} 'Nunito',sans-serif`;

export const MUTED = '#9A9AA3';
export const DIM = '#5E5E66';
export const TNUM: CSSProperties = { fontVariantNumeric: 'tabular-nums' };

export function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="icon-btn" onClick={onClick} aria-label="Zurück"><BackIcon /></button>;
}

/** Back button + title row used by most sub-screens. */
export function Header({ onBack, padding = '16px 18px 0', children }: { onBack: () => void; padding?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding }}>
      <BackButton onClick={onBack} />
      {children}
    </div>
  );
}

export const HeaderTitle = ({ children }: { children: ReactNode }) => <span style={{ font: f(900, 20), letterSpacing: '-.4px' }}>{children}</span>;

export function PrimaryCta({ onClick, enabled = true, children, style }: { onClick: () => void; enabled?: boolean; children: ReactNode; style?: CSSProperties }) {
  return <button className="btn btn--primary" onClick={onClick} style={{ opacity: enabled ? 1 : 0.4, ...style }}>{children}</button>;
}

export const Overline = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ font: f(800, 11), letterSpacing: '1.2px', color: MUTED, ...style }}>{children}</div>
);

/** Token/coin avatar: rounded square with a letter mark. */
export function Mark({ size, radius, fontSize, bg, ink, children }: { size: number; radius: number; fontSize: number; bg: string; ink: string; children: ReactNode }) {
  return (
    <span style={{ flex: 'none', width: size, height: size, borderRadius: radius, background: bg, color: ink, display: 'grid', placeItems: 'center', font: f(900, fontSize) }}>
      {children}
    </span>
  );
}

export function Chip({ label, bg, ink, onClick, style }: { label: string; bg: string; ink: string; onClick: () => void; style?: CSSProperties }) {
  return (
    <button onClick={onClick} style={{ border: 0, flex: 'none', borderRadius: 13, padding: '8px 14px', cursor: 'pointer', font: f(800, 12.5), background: bg, color: ink, ...style }}>
      {label}
    </button>
  );
}

/** Key/value detail rows separated by hairlines (first row has none). */
export function KvRows({ rows, pad, size = 13.5, numeric = true, breakAll = false }: { rows: Row[]; pad: string; size?: number; numeric?: boolean; breakAll?: boolean }) {
  return (
    <>
      {rows.map((d) => (
        <div key={d.k} style={{ display: 'flex', justifyContent: 'space-between', gap: breakAll ? 18 : 14, padding: pad, borderTop: `1px solid ${d.divider}` }}>
          <span style={{ flex: breakAll ? 'none' : undefined, font: f(800, size), color: MUTED }}>{d.k}</span>
          <span style={{ textAlign: 'right', font: breakAll ? f(800, size, 1.45) : f(800, size), color: d.ink, wordBreak: breakAll ? 'break-all' : undefined, ...(numeric ? TNUM : null) }}>{d.v}</span>
        </div>
      ))}
    </>
  );
}

export function Notice({ bg, ink, children, style }: { bg: string; ink: string; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ borderRadius: 16, background: bg, padding: '12px 14px', font: f(800, 13, 1.45), color: ink, ...style }}>{children}</div>;
}

/** Bottom sheet with scrim, used for slippage and reset. */
export function Sheet({ onClose, scrim, z, children }: { onClose: () => void; scrim: number; z: number; children: ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${scrim})`, zIndex: z }} />
      <div style={{ position: 'absolute', left: 8, right: 8, bottom: 8, zIndex: z + 1, background: '#0E0E11', borderRadius: 34, padding: '22px 20px 28px', animation: 'antheaRise .3s cubic-bezier(.22,1,.36,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><span style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.2)' }} /></div>
        {children}
      </div>
    </>
  );
}

/** Area + line price chart. `id` must be unique per chart for the gradient. */
export function AreaChart({ id, paths, viewH, height, opacity }: { id: string; paths: { line: string; area: string }; viewH: number; height: number; opacity: number }) {
  return (
    <svg viewBox={`0 0 300 ${viewH}`} preserveAspectRatio="none" style={{ display: 'block', width: '100%', height, overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6C5CE7" stopOpacity={opacity} />
          <stop offset="1" stopColor="#6C5CE7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={paths.area} fill={`url(#${id})`} />
      <path d={paths.line} fill="none" stroke="#6C5CE7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function RangeTabs({ ranges, height, marginTop }: { ranges: { label: string; bg: string; ink: string; onClick: () => void }[]; height: number; marginTop: number }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginTop }}>
      {ranges.map((r) => (
        <button key={r.label} onClick={r.onClick} style={{ flex: 1, height, border: 0, borderRadius: 10, cursor: 'pointer', font: f(800, 12), background: r.bg, color: r.ink }}>{r.label}</button>
      ))}
    </div>
  );
}
