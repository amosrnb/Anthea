import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { colors, fonts, type Weight } from '../lib/theme';

type Props = TextProps & {
  size: number;
  weight?: Weight;
  color?: string;
  /** CSS-style unitless line height, e.g. 1.55 */
  lh?: number;
  ls?: number;
  tabular?: boolean;
  style?: TextStyle | TextStyle[];
};

/** Nunito text. The design sets nearly everything at 800, headings and figures at 900. */
export function Txt({ size, weight = 800, color = colors.ink, lh, ls, tabular, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: fonts[weight],
          fontSize: size,
          color,
          letterSpacing: ls,
          lineHeight: lh ? Math.round(size * lh) : undefined,
          fontVariant: tabular ? ['tabular-nums'] : undefined,
        },
        StyleSheet.flatten(style),
      ]}
    />
  );
}
