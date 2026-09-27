import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, TextInput, View } from 'react-native';
import { ACC, IND } from '../data';
import { BackButton, BigBtn, Blurred, Btn, Cta, DIM, f, Grid, Header, MUTED, nativeDriver, Overline, p, PrimaryCta, Screen, TEXTAREA, TNUM, Txt } from '../ui';
import { Icon, LockIcon } from '../ui/icons';
import type { Wallet } from '../useWallet';

const StepHeader = ({ w, label }: { w: Wallet; label: string }) => (
  <Header onBack={w.back} style={p(16, 18, 10)}>
    <Txt style={[f(800, 13), { color: MUTED }]}>{label}</Txt>
  </Header>
);

const Intro = ({ title, lead }: { title: string; lead: string }) => (
  <View style={p(14, 22, 0)}>
    <Txt accessibilityRole="header" style={[f(900, 30, 1.1), { letterSpacing: -0.8 }]}>
      {title}
    </Txt>
    <Txt style={[f(700, 14.5, 1.55), { marginTop: 12, color: MUTED }]}>{lead}</Txt>
  </View>
);

const CheckMark = () => <Icon name="check" color="#FFFFFF" size={14} weight={3} />;

/** Abstract blob illustration: rounded squares, two of them floating. */
const BLOBS = [
  { l: 58, t: 78, s: 120, r: 38, bg: IND, float: 5000 },
  { l: 148, t: 52, s: 92, r: 30, bg: '#1A1A1F', float: 6000 },
  { l: 206, t: 146, s: 72, r: 24, bg: '#22222A' },
  { l: 252, t: 72, s: 40, r: 14, bg: IND },
  { l: 78, t: 214, s: 52, r: 18, bg: '#1A1A1F' },
  { l: 286, t: 200, s: 26, r: 9, bg: 'rgba(108,92,231,.5)' },
];

/** CSS `antheaFloat`: 0 → −8 → 0 pt, ease-in-out, infinite. */
function Blob({ b }: { b: (typeof BLOBS)[number] }) {
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!b.float) return;
    const half = { duration: b.float / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: nativeDriver };
    const loop = Animated.loop(Animated.sequence([Animated.timing(y, { toValue: -8, ...half }), Animated.timing(y, { toValue: 0, ...half })]));
    loop.start();
    return () => loop.stop();
  }, [b.float, y]);
  return (
    <Animated.View
      style={{ position: 'absolute', left: b.l, top: b.t, width: b.s, height: b.s, borderRadius: b.r, backgroundColor: b.bg, transform: [{ translateY: y }] }}
    />
  );
}

export function Welcome({ w }: { w: Wallet }) {
  return (
    <Screen>
      <View style={{ height: 290, marginTop: 16 }}>
        {BLOBS.map((b, i) => (
          <Blob key={i} b={b} />
        ))}
      </View>
      <View style={p(8, 26, 0)}>
        <Txt accessibilityRole="header" style={[f(900, 38, 1.08), { letterSpacing: -1.2 }]}>
          Deine Schlüssel. Dein Gerät.
        </Txt>
        <Txt style={[f(700, 15, 1.55), { marginTop: 14, color: MUTED, maxWidth: 310 }]}>
          Ethereum, Solana und Bitcoin in einer App. Kein Konto, keine E-Mail, kein KYC.
        </Txt>
      </View>
      <Cta style={{ gap: 10 }}>
        <BigBtn variant="primary" hover onPress={w.startCreate}>
          Neues Wallet erstellen
        </BigBtn>
        <BigBtn variant="secondary" hover onPress={w.startImport}>
          Bestehendes Wallet importieren
        </BigBtn>
      </Cta>
    </Screen>
  );
}

export function Warn({ w }: { w: Wallet }) {
  return (
    <Screen>
      <StepHeader w={w} label="Schritt 1 von 4" />
      <Intro title="Bevor es losgeht" lead="Anthea erzeugt gleich 12 Wörter. Sie sind der einzige Zugang zu deinem Geld." />
      <View style={[{ gap: 8 }, p(22, 16, 0)]}>
        {w.warnRows.map((r) => (
          <Btn key={r.text} onPress={r.onClick} role="checkbox" checked={r.on} style={styles.warnRow}>
            <View style={[styles.checkBox, { backgroundColor: r.on ? IND : '#2A2A32' }]}>{r.on && <CheckMark />}</View>
            <Txt style={[f(800, 15, 1.4), { flexShrink: 1 }]}>{r.text}</Txt>
          </Btn>
        ))}
      </View>
      <Cta>
        <PrimaryCta onClick={w.warnNext} enabled={w.warnOk}>
          Wörter anzeigen
        </PrimaryCta>
      </Cta>
    </Screen>
  );
}

const Badge = ({ children }: { children: string }) => (
  <View style={[{ backgroundColor: 'rgba(108,92,231,.14)', borderRadius: 8 }, p(5, 9)]}>
    <Txt style={[f(800, 11), { color: ACC }]}>{children}</Txt>
  </View>
);

/**
 * Seed words in a 2-column grid. While `hidden`, the words are not rendered at all, only same-width placeholders:
 * a blur alone is not reliable on every platform (Android falls back to a tint) and would leave the words in the
 * view tree for screenshots and accessibility services.
 */
export function WordGrid({ words, cell, cellBg, hidden = false }: { words: Wallet['seedWords']; cell: number; cellBg: string; hidden?: boolean }) {
  return (
    <Grid cols={2} colGap={8} rowGap={8}>
      {words.map((s) => (
        <View key={s.n} style={[styles.word, p(cell, 12), { backgroundColor: cellBg }]}>
          <Txt style={[f(800, 12), { width: 18, color: DIM }, TNUM]}>{s.n}</Txt>
          {hidden ? (
            <View style={styles.wordPlaceholder} />
          ) : (
            <Txt selectable={false} style={f(900, 15.5)}>
              {s.w}
            </Txt>
          )}
        </View>
      ))}
    </Grid>
  );
}
export function Seed({ w }: { w: Wallet }) {
  return (
    <Screen>
      <StepHeader w={w} label="Schritt 2 von 4" />
      <Intro title="Deine Wiederherstellungsphrase" lead="Schreibe die Wörter in dieser Reihenfolge auf Papier. Nicht fotografieren, nicht in die Cloud." />
      <View style={[{ flexDirection: 'row', gap: 6 }, p(16, 22, 0)]}>
        <Badge>Screenshots blockiert</Badge>
        <Badge>Kopieren deaktiviert</Badge>
      </View>
      <Btn onPress={w.revealSeed} label={w.seedShown ? undefined : 'Zum Anzeigen tippen'} style={styles.seedBox}>
        <Blurred on={!w.seedShown} radius={9}>
          <WordGrid words={w.seedWords} cell={10} cellBg="#1E1E23" hidden={!w.seedShown} />
        </Blurred>
        {!w.seedShown && (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            <Txt style={f(900, 15)}>Zum Anzeigen tippen</Txt>
          </View>
        )}
      </Btn>
      <Cta>
        <PrimaryCta onClick={w.seedNext} enabled={w.seedShown}>
          Ich habe sie notiert
        </PrimaryCta>
      </Cta>
    </Screen>
  );
}

export function Verify({ w }: { w: Wallet }) {
  return (
    <Screen>
      <StepHeader w={w} label="Schritt 3 von 4" />
      <Intro title="Kurz prüfen" lead="Wähle das richtige Wort für jede Position." />
      <View style={[{ gap: 18 }, p(24, 22, 0)]}>
        {w.verifyRows.map((v) => (
          <View key={v.pos}>
            <Overline style={f(800, 12)}>WORT #{v.pos}</Overline>
            <Grid cols={3} colGap={8} style={{ marginTop: 10 }}>
              {v.opts.map((o) => (
                <Btn key={o.w} onPress={o.onClick} style={[styles.option, { backgroundColor: o.bg }]}>
                  <Txt style={[f(900, 15), { color: o.ink }]}>{o.w}</Txt>
                </Btn>
              ))}
            </Grid>
          </View>
        ))}
      </View>
      <Cta>
        <PrimaryCta onClick={w.verifyNext} enabled={w.verifyOk}>
          Weiter
        </PrimaryCta>
      </Cta>
    </Screen>
  );
}

/** Props that keep seed words out of autocorrect, keyboard learning, autofill and the edit menu (BUILD_PLAN 5.4). */
export const SEED_INPUT_PROPS = {
  autoCorrect: false,
  autoComplete: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  contextMenuHidden: true,
  importantForAutofill: 'no',
} as const;

export function Import({ w }: { w: Wallet }) {
  return (
    <Screen>
      <StepHeader w={w} label="Import" />
      <Intro title="Phrase eingeben" lead="12 oder 24 Wörter, durch Leerzeichen getrennt." />
      <View style={[{ marginTop: 18, marginHorizontal: 16, borderRadius: 24, backgroundColor: '#141418' }, p(16)]}>
        <TextInput
          value={w.importText}
          onChangeText={w.onImport}
          placeholder="wort1 wort2 wort3 …"
          placeholderTextColor={DIM}
          multiline
          accessibilityLabel="Wiederherstellungsphrase"
          {...SEED_INPUT_PROPS}
          style={[styles.input, f(800, 16, 1.6), { height: 120 }]}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 6 }}>
          <Txt style={[f(800, 12.5), { color: w.importInk, flexShrink: 1 }]}>{w.importMsg}</Txt>
          <Btn onPress={w.importDemo}>
            <Txt style={[f(800, 12.5), { color: ACC }]}>Testphrase</Txt>
          </Btn>
        </View>
      </View>
      <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, p(12, 16, 0)]}>
        {w.importSugg.map((s) => (
          <Btn key={s.w} onPress={s.onClick} style={[{ borderRadius: 12, backgroundColor: '#1E1E23' }, p(8, 13)]}>
            <Txt style={f(800, 13.5)}>{s.w}</Txt>
          </Btn>
        ))}
      </View>
      <Txt style={[f(700, 12, 1.5), { marginTop: 14, marginHorizontal: 22, color: DIM }]}>
        Autokorrektur und Tastaturvorschläge sind deaktiviert. Vorschläge stammen nur aus der BIP39-Wortliste.
      </Txt>
      <Cta>
        <PrimaryCta onClick={w.importNext} enabled={w.importValid}>
          Importieren
        </PrimaryCta>
      </Cta>
    </Screen>
  );
}

/** 3×4 PIN keypad; shared by the PIN screen and the signing sheet. */
export function PinPad({
  keys,
  keyHeight,
  fontSize,
  rowGap,
  style,
  testIDPrefix,
}: {
  keys: Wallet['pinKeys'];
  /** Test IDs `<prefix>-0`…`<prefix>-9` for the digit keys (E2E tests). */
  testIDPrefix: string;
  keyHeight: number;
  fontSize: number;
  rowGap: number;
  style?: object;
}) {
  return (
    <Grid cols={3} colGap={22} rowGap={rowGap} style={style}>
      {keys.map((k, i) => (
        <Btn
          key={i}
          onPress={k.onClick}
          label={k.label || (k.icon ? 'Löschen' : undefined)}
          testID={k.label ? `${testIDPrefix}-${k.label}` : undefined}
          style={[styles.pinKey, { width: keyHeight, height: keyHeight, borderRadius: keyHeight / 2, backgroundColor: k.bg }]}
          activeStyle={{ backgroundColor: '#2A2A32' }}
        >
          {k.label ? <Txt style={[f(900, fontSize), TNUM]}>{k.label}</Txt> : k.icon}
        </Btn>
      ))}
    </Grid>
  );
}

export const PinDots = ({ dots }: { dots: string[] }) => (
  <View style={{ flexDirection: 'row', gap: 14 }}>
    {dots.map((bg, i) => (
      <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: bg }} />
    ))}
  </View>
);

export function Pin({ w }: { w: Wallet }) {
  return (
    <Screen>
      <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 66 }, p(16, 18, 10)]}>
        {w.pinCanBack && <BackButton onClick={w.back} />}
      </View>
      <View style={[{ alignItems: 'center' }, p(26, 30, 0)]}>
        <View style={[styles.center, { width: 56, height: 56, borderRadius: 19, backgroundColor: IND }]}>
          <LockIcon size={24} color="#FFFFFF" weight={2.4} />
        </View>
        <Txt accessibilityRole="header" style={[f(900, 26), { marginTop: 20, letterSpacing: -0.6, textAlign: 'center' }]}>
          {w.pinTitle}
        </Txt>
        <Txt style={[f(700, 14, 1.5), { marginTop: 8, color: MUTED, maxWidth: 290, textAlign: 'center' }]}>{w.pinSub}</Txt>
        <View style={{ marginTop: 28 }}>
          <PinDots dots={w.pinDots} />
        </View>
        <Txt accessibilityRole="alert" style={[f(800, 13), { height: 22, marginTop: 14, color: '#FF8F80', textAlign: 'center' }]}>
          {w.pinError}
        </Txt>
      </View>
      <PinPad keys={w.pinKeys} testIDPrefix="pin-key" keyHeight={66} fontSize={26} rowGap={10} style={[{ marginTop: 'auto' }, p(0, 44, 40)]} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, backgroundColor: '#141418' },
  checkBox: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  seedBox: { marginTop: 14, marginHorizontal: 16, padding: 16, borderRadius: 24, backgroundColor: '#141418' },
  word: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14 },
  option: { height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: TEXTAREA,
  // Round keys (product owner decision after Phase 0; the prototype stretched them to ovals).
  pinKey: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  // Height of one line of 15.5 pt Nunito, so the hidden grid has the same size as the revealed one.
  wordPlaceholder: { width: 64, height: 12, marginVertical: (15.5 * 1.364 - 12) / 2, borderRadius: 6, backgroundColor: 'rgba(247,247,245,.28)' },
});
