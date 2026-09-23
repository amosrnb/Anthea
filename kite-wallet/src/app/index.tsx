import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cta } from '../components/Buttons';
import { Txt } from '../components/Txt';
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
  const { status } = useWallet();

  if (status === 'locked') return <Redirect href="/unlock" />;
  if (status === 'unlocked') return <Redirect href="/home" />;

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
          Ethereum and Solana in one wallet. Keys stay on your device.
        </Txt>
      </View>

      <View style={{ marginTop: 'auto', paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 34), gap: 10 }}>
        <Cta label="Create a new wallet" onPress={() => router.push('/create')} />
        <Cta label="Add an existing wallet" variant="secondary" onPress={() => router.push('/import')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: 390, height: 300, marginTop: 16, alignSelf: 'center' },
});
