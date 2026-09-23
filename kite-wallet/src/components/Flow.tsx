import { useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '../lib/theme';
import { Chip, Eyebrow, IconButton } from './Buttons';
import { Txt } from './Txt';

/** Full-screen form layout: back button, eyebrow + title, scrollable body, footer pinned above the keyboard. */
export function FlowScreen({ eyebrow, title, sub, onBack, children, footer }: {
  eyebrow?: string;
  title: string;
  sub?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 30) }}>
        <View style={{ paddingTop: 20, paddingHorizontal: 18, height: 60 }}>
          {onBack && <IconButton icon="back" size={15} strokeWidth={2.1} onPress={onBack} label="Back" />}
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ paddingTop: 10, paddingHorizontal: 18, paddingBottom: 16 }}>
            {eyebrow && <Eyebrow ls={1.4}>{eyebrow}</Eyebrow>}
            <Txt size={32} weight={900} ls={-0.7} lh={1.1} style={{ marginTop: eyebrow ? 8 : 0 }} accessibilityRole="header">{title}</Txt>
            {sub && <Txt size={13.5} lh={1.5} color={colors.muted} style={{ marginTop: 8 }}>{sub}</Txt>}
          </View>
          <View style={{ paddingHorizontal: 16 }}>{children}</View>
        </ScrollView>
        {footer && <View style={{ paddingTop: 14, paddingHorizontal: 16, gap: 10 }}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  );
}

/** Labelled input on the raised control surface. */
export function Field({ label, error, style, ...rest }: TextInputProps & { label: string; error?: string | null }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
        <Eyebrow>{label}</Eyebrow>
      </View>
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        autoCapitalize="none"
        autoCorrect={false}
        {...rest}
        style={[styles.input, rest.multiline && { minHeight: 110, textAlignVertical: 'top', paddingTop: 16 }, style]}
      />
      {!!error && <ErrorText>{error}</ErrorText>}
    </View>
  );
}

export function ErrorText({ children }: { children: string }) {
  return <Txt size={12.5} color={colors.neg} style={{ marginTop: 8, marginHorizontal: 4 }}>{children}</Txt>;
}

/** Bottom sheet in the onboarding sheet style: dimmed blur backdrop, rises from the bottom. */
export function Sheet({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [rise] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(rise, { toValue: 1, duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start();
  }, [rise]);

  return (
    <>
      <Pressable style={[StyleSheet.absoluteFill, { zIndex: 25 }]} onPress={onClose} accessibilityLabel="Close">
        <BlurView intensity={8} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,.5)' }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom > 0 ? 51 : 26,
            transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [520, 0] }) }],
          },
        ]}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.2)' }} />
        </View>
        <Txt size={22} weight={900} ls={-0.7} style={{ marginTop: 16, marginHorizontal: 4, marginBottom: 4 }} accessibilityRole="header">{title}</Txt>
        {sub && <Txt size={13.5} lh={1.5} color={colors.muted} style={{ marginHorizontal: 4 }}>{sub}</Txt>}
        <View style={{ marginTop: 16 }}>{children}</View>
      </Animated.View>
    </>
  );
}

/** Numbered 2-column seed phrase grid. */
export function MnemonicGrid({ words }: { words: string[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityLabel="Seed phrase">
      {words.map((w, i) => (
        <View key={i} style={styles.word}>
          <Txt size={12.5} tabular color={colors.muted} style={{ width: 22 }}>{i + 1}</Txt>
          <Txt size={15.5} selectable>{w}</Txt>
        </View>
      ))}
    </View>
  );
}

/** Asks for three words from the phrase by position; calls onDone once all are correct. */
export function WordQuiz({ words, onDone }: { words: string[]; onDone: () => void }) {
  const [positions] = useState(() => pickPositions(words.length));
  const [step, setStep] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const pos = positions[step];
  const [options, setOptions] = useState(() => optionsFor(words, positions[0]));

  const choose = (w: string) => {
    if (w !== words[pos]) {
      setWrong(w);
      return;
    }
    setWrong(null);
    if (step === positions.length - 1) {
      onDone();
      return;
    }
    setStep(step + 1);
    setOptions(optionsFor(words, positions[step + 1]));
  };

  return (
    <View>
      <Eyebrow>{`CHECK ${step + 1} OF ${positions.length}`}</Eyebrow>
      <Txt size={22} weight={900} ls={-0.7} style={{ marginTop: 10 }}>{`Which is word #${pos + 1}?`}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
        {options.map((w) => <Chip key={w} label={w} on={false} onPress={() => choose(w)} />)}
      </View>
      {wrong && <ErrorText>{`"${wrong}" isn't word #${pos + 1}. Check your backup and try again.`}</ErrorText>}
    </View>
  );
}

function pickPositions(n: number) {
  const all = Array.from({ length: n }, (_, i) => i);
  const out: number[] = [];
  while (out.length < 3) out.push(all.splice(Math.floor(Math.random() * all.length), 1)[0]);
  return out.sort((a, b) => a - b);
}

function optionsFor(words: string[], pos: number) {
  // Real seed phrases can repeat a word, so keep the choices unique.
  const others = [...new Set(words.filter((w) => w !== words[pos]))].sort(() => Math.random() - 0.5).slice(0, 3);
  return [words[pos], ...others].sort(() => Math.random() - 0.5);
}

const styles = StyleSheet.create({
  input: {
    minHeight: 56,
    outlineWidth: 0,
    borderRadius: 20,
    backgroundColor: colors.raised,
    paddingHorizontal: 16,
    fontFamily: fonts[800],
    fontSize: 15.5,
    color: colors.ink,
  },
  sheet: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
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
  word: {
    width: '48.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.raised,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
});
