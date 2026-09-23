import { useRef } from 'react';
import { View, type GestureResponderEvent } from 'react-native';

import { colors } from '../lib/theme';

/** 8 pt track with an indigo fill and rounded-square thumb. Tap or drag to set 0–100. */
export function SizeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const track = useRef<View>(null);
  const origin = useRef({ x: 0, w: 1 });

  const update = (e: GestureResponderEvent) => {
    const { x, w } = origin.current;
    onChange(Math.max(0, Math.min(100, Math.round(((e.nativeEvent.pageX - x) / w) * 100))));
  };

  return (
    <View
      ref={track}
      accessibilityRole="adjustable"
      accessibilityLabel="Swap size"
      accessibilityValue={{ min: 0, max: 100, now: value, text: `${value}%` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.max(0, Math.min(100, value + (e.nativeEvent.actionName === 'increment' ? 5 : -5))))}
      hitSlop={{ top: 14, bottom: 14 }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        const pageX = e.nativeEvent.pageX;
        track.current?.measureInWindow((x, _y, w) => {
          origin.current = { x, w: w || 1 };
          onChange(Math.max(0, Math.min(100, Math.round(((pageX - x) / (w || 1)) * 100))));
        });
      }}
      onResponderMove={update}
      style={{ marginTop: 14, height: 8, borderRadius: 4, backgroundColor: colors.track }}
    >
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value}%`, borderRadius: 4, backgroundColor: colors.accent }} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -7,
          left: `${value}%`,
          marginLeft: -11,
          width: 22,
          height: 22,
          borderRadius: 8,
          backgroundColor: colors.accent,
          borderWidth: 3,
          borderColor: colors.surface,
          shadowColor: colors.accent,
          shadowOpacity: 0.35,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
        }}
      />
    </View>
  );
}
