import { Platform, type TextStyle } from 'react-native';

/** Locally bundled Nunito weights (BUILD_PLAN 4.2: no remote fonts). Keys are registered in App via expo-font. */
export const FONT_FILES = {
  'Nunito-600': require('../../assets/fonts/Nunito_600SemiBold.ttf'),
  'Nunito-700': require('../../assets/fonts/Nunito_700Bold.ttf'),
  'Nunito-800': require('../../assets/fonts/Nunito_800ExtraBold.ttf'),
  'Nunito-900': require('../../assets/fonts/Nunito_900Black.ttf'),
} as const;

export type Weight = 600 | 700 | 800 | 900;

/**
 * Typography helper, the RN counterpart of the prototype's CSS `font` shorthand:
 * f(900, 15, 1.4) → Nunito Black 15 with a line height of 1.4 × 15.
 */
export const f = (weight: Weight, size: number, lineHeight?: number): TextStyle => ({
  fontFamily: `Nunito-${weight}`,
  fontSize: size,
  ...(lineHeight != null ? { lineHeight: size * lineHeight } : null),
});

export const MUTED = '#9A9AA3';
export const DIM = '#5E5E66';
export const WHITE = '#F7F7F5';
export const TNUM: TextStyle = { fontVariant: ['tabular-nums'] };

/** CSS-style padding shorthand in pt: p(16, 18, 10) → top 16, left/right 18, bottom 10. */
export const p = (t: number, r = t, b = t, l = r) => ({ paddingTop: t, paddingRight: r, paddingBottom: b, paddingLeft: l });
/** CSS-style margin shorthand in pt. */
export const m = (t: number, r = t, b = t, l = r) => ({ marginTop: t, marginRight: r, marginBottom: b, marginLeft: l });

export const isWeb = Platform.OS === 'web';
/** The JS driver is required on web; native uses the UI thread. */
export const nativeDriver = !isWeb;

/** Web-only style keys (react-native-web passes them through to CSS); ignored on native. */
export const webOnly = (style: Record<string, unknown>) => (isWeb ? (style as object) : null);

/**
 * Multiline input matching the prototype's <textarea>: 2 px UA padding inside the fixed height, plus the gap an
 * inline-block leaves below itself in a 16 px Nunito line box (descent 0.353 em).
 */
export const TEXTAREA = {
  padding: 2,
  marginBottom: 16 * 0.353,
  color: WHITE,
  textAlignVertical: 'top',
  ...webOnly({ outlineStyle: 'none', resize: 'none' }),
} as const;
