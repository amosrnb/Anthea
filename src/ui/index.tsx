import { BlurView } from 'expo-blur';
import { Children, useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableStateCallbackType,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { Row } from '../useWallet';
import { BackIcon } from './icons';
import { f, isWeb, MUTED, nativeDriver, p, TNUM, webOnly, WHITE } from './theme';

export * from './theme';

const IND = '#6C5CE7';

/** Text with the prototype's inherited defaults (Nunito 800, 16, off-white). */
export function Txt({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.txt, style]} />;
}

/** Pressable state incl. react-native-web's `hovered`, so hover styles from the prototype work on web. */
type PressState = PressableStateCallbackType & { hovered?: boolean };

interface BtnProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  /** Style while pressed (the prototype's :active). */
  activeStyle?: StyleProp<ViewStyle>;
  /** Style while hovered on web or pressed on touch devices (the prototype's :hover). */
  hoverStyle?: StyleProp<ViewStyle>;
  label?: string;
  role?: 'button' | 'checkbox';
  checked?: boolean;
  testID?: string;
  children?: ReactNode;
}

export function Btn({ onPress, style, activeStyle, hoverStyle, label, role = 'button', checked, testID, children }: BtnProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={role === 'checkbox' ? { checked } : undefined}
      testID={testID}
      style={(s: PressState) => [style, s.hovered || s.pressed ? hoverStyle : null, s.pressed ? activeStyle : null]}
    >
      {children}
    </Pressable>
  );
}

/** 40×40 translucent square icon button (`.icon-btn`). */
export function IconBtn({
  onPress,
  label,
  hover,
  style,
  children,
}: {
  onPress: () => void;
  label?: string;
  hover?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Btn onPress={onPress} label={label} style={[styles.iconBtn, style]} hoverStyle={hover ? styles.iconBtnHover : undefined}>
      {children}
    </Btn>
  );
}

/** Full-width 60 pt button (`.btn--primary` / `.btn--secondary`). */
export function BigBtn({
  variant,
  onPress,
  children,
  hover,
  enabled = true,
  style,
  textStyle,
}: {
  variant: 'primary' | 'secondary';
  onPress: () => void;
  children: ReactNode;
  hover?: boolean;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  const primary = variant === 'primary';
  return (
    <Btn
      onPress={onPress}
      style={[styles.btn, primary ? styles.btnPrimary : styles.btnSecondary, !enabled && styles.disabled, style]}
      hoverStyle={hover ? (primary ? styles.btnPrimaryHover : styles.btnSecondaryHover) : undefined}
    >
      <Txt style={[primary ? styles.btnPrimaryText : styles.btnSecondaryText, textStyle]}>{children}</Txt>
    </Btn>
  );
}

export function PrimaryCta({
  onClick,
  enabled = true,
  children,
  style,
  textStyle,
}: {
  onClick: () => void;
  enabled?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <BigBtn variant="primary" onPress={onClick} enabled={enabled} style={style} textStyle={textStyle}>
      {children}
    </BigBtn>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <IconBtn onPress={onClick} label="Zurück">
      <BackIcon />
    </IconBtn>
  );
}

/** Back button + title row used by most sub-screens. */
export function Header({ onBack, style, children }: { onBack: () => void; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <View style={[styles.header, style]}>
      <BackButton onClick={onBack} />
      {children}
    </View>
  );
}

export const HeaderTitle = ({ children }: { children: ReactNode }) => <Txt style={[f(900, 20), { letterSpacing: -0.4 }]}>{children}</Txt>;

export const Overline = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Txt style={[f(800, 11), { letterSpacing: 1.2, color: MUTED }, style]}>{children}</Txt>
);

/** Token/coin avatar: rounded square with a letter mark. */
export function Mark({
  size,
  radius,
  fontSize,
  bg,
  ink,
  children,
}: {
  size: number;
  radius: number;
  fontSize: number;
  bg: string;
  ink: string;
  children: ReactNode;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Txt style={[f(900, fontSize), { color: ink }]}>{children}</Txt>
    </View>
  );
}

export function Chip({
  label,
  bg,
  ink,
  onClick,
  style,
  textStyle,
}: {
  label: string;
  bg: string;
  ink: string;
  onClick: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) {
  return (
    <Btn onPress={onClick} style={[styles.chip, { backgroundColor: bg }, style]}>
      <Txt style={[f(800, 12.5), { color: ink }, textStyle]}>{label}</Txt>
    </Btn>
  );
}

/** Key/value detail rows separated by hairlines (first row has none). */
export function KvRows({
  rows,
  pad,
  size = 13.5,
  numeric = true,
  breakAll = false,
}: {
  rows: Row[];
  pad: [number, number];
  size?: number;
  numeric?: boolean;
  breakAll?: boolean;
}) {
  return (
    <>
      {rows.map((d) => (
        <View key={d.k} style={[styles.kvRow, p(pad[0], pad[1]), { gap: breakAll ? 18 : 14, borderTopColor: d.divider }]}>
          <Txt style={[f(800, size), { color: MUTED }]}>{d.k}</Txt>
          <Txt
            style={[
              breakAll ? f(800, size, 1.45) : f(800, size),
              styles.kvValue,
              { color: d.ink },
              numeric && TNUM,
              breakAll && webOnly({ wordBreak: 'break-all' }),
            ]}
          >
            {d.v}
          </Txt>
        </View>
      ))}
    </>
  );
}

export function Notice({ bg, ink, children, style }: { bg: string; ink: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ borderRadius: 16, backgroundColor: bg }, p(12, 14), style]}>
      <Txt style={[f(800, 13, 1.45), { color: ink }]}>{children}</Txt>
    </View>
  );
}

/** Extra bottom spacing on devices whose bottom inset exceeds the 34 pt the design reserves for the home indicator. */
export function useBottomExtra() {
  const insets = useSafeAreaInsets();
  return Math.max(0, insets.bottom - 34);
}

/** Bottom sheet with scrim and rise animation, used for slippage, reset and PIN confirmation. */
export function Sheet({ onClose, scrim, z, children }: { onClose: () => void; scrim: number; z: number; children: ReactNode }) {
  const [rise] = useState(() => new Animated.Value(0));
  const extra = useBottomExtra();
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: nativeDriver }).start();
  }, [rise]);
  return (
    <>
      <Pressable onPress={onClose} accessibilityLabel="Schließen" style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${scrim})`, zIndex: z }]} />
      <Animated.View
        style={[
          styles.sheet,
          { bottom: 8 + extra, zIndex: z + 1 },
          { transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }] },
        ]}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.2)' }} />
        </View>
        {children}
      </Animated.View>
    </>
  );
}

/** Area + line price chart. `id` must be unique per chart for the gradient. */
export function AreaChart({
  id,
  paths,
  viewH,
  height,
  opacity,
}: {
  id: string;
  paths: { line: string; area: string };
  viewH: number;
  height: number;
  opacity: number;
}) {
  return (
    <Svg width="100%" height={height} viewBox={`0 0 300 ${viewH}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={IND} stopOpacity={opacity} />
          <Stop offset="1" stopColor={IND} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={paths.area} fill={`url(#${id})`} />
      <Path d={paths.line} fill="none" stroke={IND} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </Svg>
  );
}

export function RangeTabs({
  ranges,
  height,
  marginTop,
}: {
  ranges: { label: string; bg: string; ink: string; onClick: () => void }[];
  height: number;
  marginTop: number;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginTop }}>
      {ranges.map((r) => (
        <Btn
          key={r.label}
          onPress={r.onClick}
          style={{ flex: 1, height, borderRadius: 10, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center' }}
        >
          <Txt style={[f(800, 12), { color: r.ink }]}>{r.label}</Txt>
        </Btn>
      ))}
    </View>
  );
}

/** Equal-width column grid (CSS `grid-template-columns: repeat(n, 1fr)`). */
export function Grid({
  cols,
  colGap = 0,
  rowGap = 0,
  style,
  children,
}: {
  cols: number;
  colGap?: number;
  rowGap?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const items = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={[{ gap: rowGap }, style]}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: colGap }}>
          {row.map((item, c) => (
            <View key={c} style={{ flex: 1, minWidth: 0 }}>
              {item}
            </View>
          ))}
          {Array.from({ length: cols - row.length }, (_, c) => (
            <View key={'pad' + c} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** Fixed-height screen (`.screen`). */
export const Screen = ({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) => <View style={[styles.screen, style]}>{children}</View>;

/** Scrolling tab screen (`.scroll`). */
export const Scroll = ({ contentStyle, children }: { contentStyle?: StyleProp<ViewStyle>; children: ReactNode }) => (
  <ScrollView style={styles.screen} contentContainerStyle={contentStyle} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
    {children}
  </ScrollView>
);

/** Bottom call-to-action area (`.cta`): pushed to the bottom, 34 pt above the screen edge. */
export function Cta({ style, children }: { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const extra = useBottomExtra();
  return <View style={[styles.cta, { paddingBottom: 34 + extra }, style]}>{children}</View>;
}

/**
 * Blurs its content (CSS `filter: blur()` in the prototype). Web uses the CSS filter directly;
 * native overlays a BlurView, which gives the same look on the dark surfaces used here.
 */
export function Blurred({ on, radius, style, children }: { on: boolean; radius: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  if (isWeb) return <View style={[style, on ? webOnly({ filter: `blur(${radius}px)` }) : null]}>{children}</View>;
  return (
    <View style={style}>
      {children}
      {on && <BlurView tint="dark" intensity={radius * 5} style={StyleSheet.absoluteFill} />}
    </View>
  );
}

const styles = StyleSheet.create({
  txt: { ...f(800, 16), color: WHITE },
  disabled: { opacity: 0.4 },
  iconBtn: { width: 40, height: 40, borderRadius: 15, backgroundColor: 'rgba(255,255,255,.05)', alignItems: 'center', justifyContent: 'center' },
  iconBtnHover: { backgroundColor: 'rgba(255,255,255,.1)' },
  btn: { width: '100%', height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: IND },
  btnSecondary: { backgroundColor: '#141418' },
  btnPrimaryHover: { backgroundColor: '#7E70EB' },
  btnSecondaryHover: { backgroundColor: '#1E1E23' },
  btnPrimaryText: { ...f(900, 16.5), color: '#FFFFFF' },
  btnSecondaryText: { ...f(800, 16), color: WHITE },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, ...p(16, 18, 0) },
  chip: { borderRadius: 13, ...p(8, 14) },
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1 },
  kvValue: { flexShrink: 1, textAlign: 'right' },
  sheet: { position: 'absolute', left: 8, right: 8, backgroundColor: '#0E0E11', borderRadius: 34, ...p(22, 20, 28) },
  screen: { flex: 1, minHeight: 0 },
  cta: { marginTop: 'auto', paddingHorizontal: 16 },
});
