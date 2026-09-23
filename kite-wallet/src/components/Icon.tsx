import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../lib/theme';

export type IconName =
  | 'send'
  | 'swap'
  | 'flip'
  | 'chevronDown'
  | 'receive'
  | 'chevronRight'
  | 'back'
  | 'close'
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
    case 'send':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 19V5M5 12l7-7 7 7" {...s} /></Svg>;
    case 'receive':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M12 4v14M12 19l-6-6M12 19l6-6" {...s} /></Svg>;
    case 'swap':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M7 20V5m0 0L3.5 8.5M7 5l3.5 3.5M17 4v15m0 0 3.5-3.5M17 19l-3.5-3.5" {...s} /></Svg>;
    case 'flip':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M8 4v13M8 20l-3.5-4M16 20V7M16 4l3.5 4" {...s} /></Svg>;
    case 'chevronDown':
      return <Svg width={size} height={(size * 9) / 14} viewBox="0 0 14 9"><Path d="M1 1.5 7 7.5 13 1.5" {...s} /></Svg>;
    case 'chevronRight':
      return <Svg width={(size * 7) / 11} height={size} viewBox="0 0 7 11"><Path d="M1.2 1.2 5.5 5.5 1.2 9.8" {...s} /></Svg>;
    case 'back':
      return <Svg width={size} height={size} viewBox="0 0 14 14"><Path d="M9 1.5 2.5 7 9 12.5" {...s} /></Svg>;
    case 'close':
      return <Svg width={size} height={size} viewBox="0 0 14 14"><Path d="M1.5 1.5 12.5 12.5M12.5 1.5 1.5 12.5" {...s} /></Svg>;
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
