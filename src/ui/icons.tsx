import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PATHS = {
  send: 'M12 19V5M5 12l7-7 7 7',
  recv: 'M12 4v14M12 19l-6-6M12 19l6-6',
  swap: 'M7 20V5m0 0L3.5 8.5M7 5l3.5 3.5M17 4v15m0 0 3.5-3.5M17 19l-3.5-3.5',
  home: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z',
  markets: 'M4 18V9M10 18V5M16 18v-6M22 18H2',
  activity: 'M3 13h4l3-7 4 14 3-7h4',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  del: 'M9 5h11v14H9l-6-7 6-7ZM13 9.5l5 5M18 9.5l-5 5',
  check: 'M5 12.5 10 17 19 7',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, color, size = 21, weight = 2 }: { name: IconName; color: string; size?: number; weight?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={PATHS[name]} fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function StarIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4l-5.5 2.9 1-6.2L3 9.7l6.2-.9L12 3Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BackIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 14 14" fill="none" stroke="#F7F7F5" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 1.5 2.5 7 9 12.5" />
    </Svg>
  );
}

export function LockIcon({ size, color, weight }: { size: number; color: string; weight: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={5} y={11} width={14} height={9} rx={3} />
      <Path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </Svg>
  );
}

export function ScanIcon({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round">
      <Path d="M1 6V2h4M17 6V2h-4M1 12v4h4M17 12v4h-4" />
    </Svg>
  );
}

export function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} />
      <Path d="m20 20-4-4" />
    </Svg>
  );
}

export function CloseIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 14 14" fill="none" stroke="rgba(247,247,245,.7)" strokeWidth={2.1} strokeLinecap="round">
      <Path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" />
    </Svg>
  );
}

export function WarnIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#E8C46A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3 2 20h20L12 3Z" />
      <Path d="M12 10v4M12 17v.5" />
    </Svg>
  );
}

export function ToastCheck() {
  return (
    <Svg width={12} height={9} viewBox="0 0 13 10" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round">
      <Path d="M1.5 5 4.8 8.3 11.5 1.6" />
    </Svg>
  );
}
