import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cta, Swatch } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { Txt } from '../components/Txt';
import { IMPORT_OPTIONS } from '../lib/data';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

type Blob = { left: number; top: number; size: number; radius: number; color: string; float?: number };

// Abstract hero: rounded squares laid out on a 390 pt wide stage.
const BLOBS: Blob[] = [
  { left: 58, top: 78, size: 120, radius: 38, color: colors.accent, float: 5000 },
  { left: 148, top: 52, size: 92, radius: 30, color: '#1A1A1F', float: 6000 },
  { left: 206, top: 146, size: 72, radius: 24, color: '#22222A' },
  { left: 252, top: 72, size: 40, radius: 14, color: colors.accent },
  { left: 78, top: 214, size: 52, radius: 18, color: '#1A1A1F' },
  { left: 286, top: 200, size: 26, radius: 9, color: 'rgba(108,92,231,.5)' },
  { left: 40, top: 44, size: 18, radius: 6, color: '#2A2A32' },
];

function FloatingBlob({ b }: { b: Blob }) {
  const t = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!b.float) return;
    const half = b.float / 2;
    const ease = Easing.inOut(Easing.ease);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: half, easing: ease, useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: half, easing: ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [b.float, t]);

  const style: Animated.WithAnimatedObject<ViewStyle> = {
    position: 'absolute',
    left: b.left,
    top: b.top,
    width: b.size,
    height: b.size,
    borderRadius: b.radius,
    backgroundColor: b.color,
    transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
  };
  return <Animated.View style={style} />;
}

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { flash } = useWallet();
  const [sheetOpen, setSheetOpen] = useState(false);
  const rise = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!sheetOpen) return;
    rise.setValue(0);
    Animated.timing(rise, { toValue: 1, duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [sheetOpen, rise]);

  const create = () => router.replace('/home');
  const importWallet = () => {
    setSheetOpen(false);
    router.replace('/home');
    flash('Wallet imported');
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={styles.stage}>
        {BLOBS.map((b, i) => <FloatingBlob key={i} b={b} />)}
      </View>

      <View style={{ paddingTop: 8, paddingHorizontal: 26 }}>
        <Txt size={40} weight={900} lh={1.06} ls={-1.9} accessibilityRole="header">
          Everything you hold, in one view.
        </Txt>
        <Txt size={15.5} lh={1.55} color={colors.muted} style={{ marginTop: 16, maxWidth: 300 }}>
          Tokens, positions and markets together. Keys stay on your device.
        </Txt>
      </View>

      <View style={{ marginTop: 'auto', paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 34), gap: 10 }}>
        <Cta label="Create a new wallet" onPress={create} />
        <Cta label="Add an existing wallet" variant="secondary" onPress={() => setSheetOpen(true)} />
      </View>

      {sheetOpen && (
        <>
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 25 }]} onPress={() => setSheetOpen(false)} accessibilityLabel="Close">
            <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,.5)' }]} />
          </Pressable>
          <Animated.View
            style={[
              styles.sheet,
              {
                bottom: 8,
                paddingBottom: insets.bottom > 0 ? 51 : 26,
                transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [420, 0] }) }],
              },
            ]}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.2)' }} />
            </View>
            <Txt size={22} weight={900} ls={-0.7} style={{ marginTop: 16, marginHorizontal: 4, marginBottom: 4 }} accessibilityRole="header">
              Add an existing wallet
            </Txt>
            <Txt size={13.5} lh={1.5} color={colors.muted} style={{ marginHorizontal: 4 }}>
              Choose how you&apos;d like to import into Kite.
            </Txt>
            <View style={{ marginTop: 16, gap: 8 }}>
              {IMPORT_OPTIONS.map((o) => (
                <Pressable
                  key={o.title}
                  onPress={importWallet}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.option, { backgroundColor: pressed ? colors.raisedPressed : colors.raised }]}
                >
                  <Swatch size={38} radius={13} color={o.color} />
                  <View style={{ flex: 1 }}>
                    <Txt size={15.5}>{o.title}</Txt>
                    <Txt size={12.5} lh={1.4} color={colors.muted} style={{ marginTop: 2 }}>{o.sub}</Txt>
                  </View>
                  <Icon name="chevronRight" size={13} color="rgba(247,247,245,.35)" strokeWidth={2} />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: 390, height: 300, marginTop: 16, alignSelf: 'center' },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    zIndex: 26,
    backgroundColor: '#0A0A0C',
    borderRadius: 34,
    paddingTop: 22,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -18 },
    elevation: 20,
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20 },
});
