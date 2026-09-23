import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../lib/theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

export const DOCK_HEIGHT = 66;
export const dockBottom = (insetBottom: number) => Math.max(insetBottom - 10, 16);

const TABS: { k: IconName; label: string }[] = [
  { k: 'home', label: 'Home' },
  { k: 'markets', label: 'Markets' },
  { k: 'apps', label: 'Apps' },
  { k: 'activity', label: 'Activity' },
];

/** Floating glass tab bar with a raised Swap action in the middle. */
export function Dock({ active, onTab, onSwap, bottom }: {
  active: number;
  onTab: (i: number) => void;
  onSwap: () => void;
  bottom: number;
}) {
  const tab = (i: number) => {
    const on = i === active;
    return (
      <Pressable key={TABS[i].k} onPress={() => onTab(i)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.tab}>
        <Icon name={TABS[i].k} size={21} color={on ? colors.accent : colors.muted} />
        <Txt size={10} color={on ? colors.accentText : colors.muted}>{TABS[i].label}</Txt>
      </Pressable>
    );
  };

  return (
    <View style={[styles.shadow, { bottom }]}>
      <View style={styles.clip}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(19,19,22,.72)' }]} />
        <View style={styles.row}>
          {tab(0)}
          {tab(1)}
          <View style={styles.center}>
            <Pressable
              onPress={onSwap}
              accessibilityRole="button"
              accessibilityLabel="Swap"
              style={({ pressed }) => [styles.swap, { backgroundColor: pressed ? colors.accentPressed : colors.accent }]}
            >
              <Icon name="swap" size={24} color={colors.white} strokeWidth={2.1} />
            </Pressable>
          </View>
          {tab(2)}
          {tab(3)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: DOCK_HEIGHT,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  clip: { flex: 1, borderRadius: 26, overflow: 'hidden' },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  center: { width: 74, alignItems: 'center' },
  swap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.32,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 10 },
  },
});
