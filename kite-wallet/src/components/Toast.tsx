import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWallet } from '../lib/wallet-context';
import { colors } from '../lib/theme';
import { Icon } from './Icon';
import { Txt } from './Txt';

/** App-wide confirmation toast, anchored above the bottom call to action. */
export function Toast() {
  const { toast } = useWallet();
  const insets = useSafeAreaInsets();
  const anim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 4 }).start();
  }, [toast, anim]);

  if (!toast) return null;

  const bottom = Math.max(insets.bottom, 30);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.wrap,
        {
          bottom,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <View style={styles.clip}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30,30,35,.92)' }]} />
        <View style={styles.row}>
          <View style={styles.badge}>
            <Icon name="check" size={12} color={colors.white} strokeWidth={2.4} />
          </View>
          <Txt size={14}>{toast}</Txt>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  clip: { borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, paddingHorizontal: 16 },
  badge: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
});
