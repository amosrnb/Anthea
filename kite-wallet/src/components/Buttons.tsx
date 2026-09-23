import type { ReactNode } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { colors } from '../lib/theme';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type CtaProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  trailing?: ReactNode;
  style?: ViewStyle;
};

/** 60 pt full-width call to action. Primary is indigo with a soft glow; secondary is a dark fill. */
export function Cta({ label, onPress, variant = 'primary', disabled, trailing, style }: CtaProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          height: 60,
          borderRadius: 22,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          backgroundColor: primary
            ? pressed ? colors.accentPressed : colors.accent
            : pressed ? colors.surfacePressed : colors.surface,
          opacity: disabled ? 0.5 : 1,
        },
        primary && {
          shadowColor: colors.accent,
          shadowOpacity: 0.26,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 12 },
          elevation: 8,
        },
        style,
      ]}
    >
      <Txt size={primary ? 16.5 : 16} weight={primary ? 900 : 800} color={primary ? colors.white : colors.ink}>
        {label}
      </Txt>
      {trailing}
    </Pressable>
  );
}

/** 40 pt rounded-square utility button on a faint glass fill. */
export function IconButton({ icon, size = 17, color, strokeWidth = 1.8, onPress, label }: {
  icon: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: 15,
        backgroundColor: pressed ? colors.glassPressed : colors.glass,
        alignItems: 'center',
        justifyContent: 'center',
      })}
    >
      <Icon name={icon} size={size} color={color} strokeWidth={strokeWidth} />
    </Pressable>
  );
}

/** Pill chip used for filters and tabs: light when selected, dark otherwise. */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={{ borderRadius: 13, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: on ? colors.ink : colors.chip }}
    >
      <Txt size={12.5} color={on ? '#09090B' : colors.muted}>{label}</Txt>
    </Pressable>
  );
}

/** Small uppercase section label, e.g. "YOU PAY". */
export function Eyebrow({ children, ls = 1.3 }: { children: string; ls?: number }) {
  return <Txt size={11} ls={ls} color={colors.muted}>{children}</Txt>;
}

export function Swatch({ size, radius, color }: { size: number; radius: number; color: string }) {
  return <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: color }} />;
}
