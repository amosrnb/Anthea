import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../lib/theme';

export type IconName =
  | 'plus'
  | 'swap'
  | 'send'
  | 'receive'
  | 'home'
  | 'markets'
  | 'apps'
  | 'activity'
  | 'scan'
  | 'history'
  | 'chevronDown'
  | 'chevronRight'
  | 'back'
  | 'close'
  | 'flip'
  | 'check'
  | 'lock'
  | 'settings';

type Props = { name: IconName; color?: string; size?: number; strokeWidth?: number };

/** Stroked icon set lifted from the prototype. Paths are in their original viewBoxes. */
export function Icon({ name, color = colors.ink, size = 20, strokeWidth = 1.9 }: Props) {
  const s = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'plus':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 5v14M5 12h14" {...s} /></Svg>;
    case 'swap':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M7 20V5m0 0L3.5 8.5M7 5l3.5 3.5M17 4v15m0 0 3.5-3.5M17 19l-3.5-3.5" {...s} /></Svg>;
    case 'send':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 19V5M5 12l7-7 7 7" {...s} /></Svg>;
    case 'receive':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 4v14M12 19l-6-6M12 19l6-6" {...s} /></Svg>;
    case 'home':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8Z" {...s} /></Svg>;
    case 'markets':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 18V9M10 18V5M16 18v-6M22 18H2" {...s} /></Svg>;
    case 'apps':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={4} y={4} width={7} height={7} rx={2.4} {...s} />
          <Rect x={13} y={4} width={7} height={7} rx={2.4} {...s} />
          <Rect x={4} y={13} width={7} height={7} rx={2.4} {...s} />
          <Rect x={13} y={13} width={7} height={7} rx={2.4} {...s} />
        </Svg>
      );
    case 'activity':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M3 13h4l3-7 4 14 3-7h4" {...s} /></Svg>;
    case 'scan':
      return <Svg width={size} height={size} viewBox="0 0 18 18"><Path d="M1 6V2h4M17 6V2h-4M1 12v4h4M17 12v4h-4" {...s} /></Svg>;
    case 'history':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx={10} cy={10} r={8} {...s} />
          <Path d="M10 5.5V10l3.2 2" {...s} />
        </Svg>
      );
    case 'chevronDown':
      return <Svg width={size} height={(size * 9) / 14} viewBox="0 0 14 9"><Path d="M1 1.5 7 7.5 13 1.5" {...s} /></Svg>;
    case 'chevronRight':
      return <Svg width={(size * 7) / 11} height={size} viewBox="0 0 7 11"><Path d="M1.2 1.2 5.5 5.5 1.2 9.8" {...s} /></Svg>;
    case 'back':
      return <Svg width={size} height={size} viewBox="0 0 14 14"><Path d="M9 1.5 2.5 7 9 12.5" {...s} /></Svg>;
    case 'close':
      return <Svg width={size} height={size} viewBox="0 0 14 14"><Path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" {...s} /></Svg>;
    case 'flip':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M8 4v13M8 20l-3.5-4M16 20V7M16 4l3.5 4" {...s} /></Svg>;
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Rect x={5} y={10.5} width={14} height={10} rx={3} {...s} />
          <Path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" {...s} />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...s} />
          <Circle cx={15} cy={7} r={2} {...s} />
          <Circle cx={9} cy={17} r={2} {...s} />
        </Svg>
      );
    case 'check':
      return <Svg width={size} height={(size * 10) / 13} viewBox="0 0 13 10"><Path d="M1.5 5 4.8 8.3 11.5 1.6" {...s} /></Svg>;
  }
}
