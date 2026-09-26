import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { ACC, IND } from '../data';
import {
  BigBtn,
  Btn,
  Cta,
  f,
  Grid,
  Header,
  HeaderTitle,
  IconBtn,
  KvRows,
  Mark,
  MUTED,
  nativeDriver,
  Overline,
  p,
  PrimaryCta,
  Screen,
  Sheet,
  TNUM,
  Txt,
  useBottomExtra,
} from '../ui';
import { CloseIcon, Icon } from '../ui/icons';
import type { Wallet } from '../useWallet';

const WARN_BOX = { borderRadius: 16, backgroundColor: 'rgba(232,196,106,.1)', ...p(11, 14) } as const;
const WarnBox = ({ children, style }: { children: string; style?: object }) => (
  <View style={[WARN_BOX, style]}>
    <Txt style={[f(800, 12.5, 1.45), { color: '#F2DDA4' }]}>{children}</Txt>
  </View>
);

type SwapSide = Wallet['swT'];

const TokenPill = ({ t, onClick }: { t: SwapSide; onClick: () => void }) => (
  <Btn onPress={onClick} style={[styles.row, { gap: 8, backgroundColor: '#1E1E23', borderRadius: 16 }, p(7, 12, 7, 7)]}>
    <Mark size={26} radius={9} fontSize={12} bg={t.bg} ink={t.ink}>
      {t.mark}
    </Mark>
    <View>
      <Txt style={f(800, 14)}>{t.sym}</Txt>
      <Txt style={[f(800, 10.5), { color: MUTED }]}>{t.net}</Txt>
    </View>
  </Btn>
);

const Card = ({ children }: { children: ReactNode }) => <View style={[{ borderRadius: 24, backgroundColor: '#0E0E11' }, p(16, 18)]}>{children}</View>;
const CardHead = ({ left, right }: { left: string; right: string }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <Overline>{left}</Overline>
    <Txt style={[f(800, 11.5), { color: MUTED }]}>{right}</Txt>
  </View>
);
const Amount = ({ value, color }: { value: string; color?: string }) => (
  <Txt numberOfLines={1} style={[f(900, 32), { flex: 1, letterSpacing: 0.4 }, TNUM, color ? { color } : null]}>
    {value}
  </Txt>
);

export function Swap({ w }: { w: Wallet }) {
  return (
    <Screen>
      <View style={[styles.row, { justifyContent: 'space-between' }, p(16, 18, 10)]}>
        <Txt accessibilityRole="header" style={[f(900, 22), { letterSpacing: -0.6, paddingLeft: 4 }]}>
          Swappen
        </Txt>
        <View style={[styles.row, { gap: 8 }]}>
          <IconBtn onPress={w.openSlip} style={{ width: 'auto', paddingHorizontal: 13 }}>
            <Txt style={f(800, 13)}>Slippage {w.slipLabel}</Txt>
          </IconBtn>
          <IconBtn onPress={w.back} label="Schließen">
            <CloseIcon />
          </IconBtn>
        </View>
      </View>

      <View style={{ marginHorizontal: 16, gap: 6 }}>
        <Card>
          <CardHead left="DU ZAHLST" right={'Guthaben ' + w.swF.balLabel} />
          <View style={[styles.row, { gap: 12, marginTop: 12 }]}>
            <Amount value={w.swAmt} />
            <TokenPill t={w.swF} onClick={w.cycleFrom} />
          </View>
          <Txt style={[f(800, 12.5), { marginTop: 6, color: MUTED }]}>{w.swAmtFiat}</Txt>
        </Card>
        <Card>
          <CardHead left="DU ERHÄLTST (ERWARTET)" right={w.quoteLeft} />
          <View style={[styles.row, { gap: 12, marginTop: 12 }]}>
            <Amount value={w.swOut} color={ACC} />
            <TokenPill t={w.swT} onClick={w.cycleTo} />
          </View>
          <View style={styles.quoteTrack}>
            <View style={{ height: 3, backgroundColor: IND, width: `${w.quoteBar}%` }} />
          </View>
        </Card>
        <Btn onPress={w.flipSwap} label="Richtung tauschen" style={styles.flip}>
          <Icon name="swap" color={ACC} size={17} weight={2.4} />
        </Btn>
      </View>

      <Grid cols={4} colGap={8} style={p(12, 16, 0)}>
        {w.pctChips.map((c) => (
          <Btn key={c.label} onPress={c.onClick} style={[styles.center, { height: 36, borderRadius: 12, backgroundColor: c.bg }]}>
            <Txt style={[f(800, 12.5), { color: c.ink }]}>{c.label}</Txt>
          </Btn>
        ))}
      </Grid>
      <View style={{ marginTop: 10, marginHorizontal: 16 }}>
        <KvRows rows={w.quoteRows} pad={[9, 4]} size={13} />
      </View>
      {w.impactWarn && <WarnBox style={{ marginTop: 6, marginHorizontal: 16 }}>Hohe Preisauswirkung über 3 %. Prüfe Betrag und Route.</WarnBox>}
      <Cta style={{ paddingTop: 12 }}>
        <PrimaryCta onClick={w.swapNext}>Swap prüfen</PrimaryCta>
      </Cta>
    </Screen>
  );
}

/** Slippage sheet; rendered by App above the dock layer like the other sheets. */
export function SlippageSheet({ w }: { w: Wallet }) {
  return (
    <Sheet onClose={w.closeSlip} scrim={0.55} z={25}>
      <Txt accessibilityRole="header" style={[f(900, 21), { marginTop: 16, marginHorizontal: 4, marginBottom: 4 }]}>
        Slippage-Toleranz
      </Txt>
      <Txt style={[f(700, 13.5, 1.5), { marginHorizontal: 4, color: MUTED }]}>Fällt der Kurs weiter, wird der Swap abgebrochen.</Txt>
      <Grid cols={4} colGap={8} style={{ marginTop: 16 }}>
        {w.slipOpts.map((s) => (
          <Btn key={s.label} onPress={s.onClick} style={[styles.center, { height: 46, borderRadius: 15, backgroundColor: s.bg }]}>
            <Txt style={[f(900, 14.5), { color: s.ink }]}>{s.label}</Txt>
          </Btn>
        ))}
      </Grid>
      {w.slipWarn && <WarnBox style={{ marginTop: 12, borderRadius: 14 }}>Über 1 % steigt das Risiko einer schlechten Ausführung.</WarnBox>}
      <PrimaryCta onClick={w.closeSlip} style={{ marginTop: 16, height: 54, borderRadius: 20 }} textStyle={f(900, 15.5)}>
        Übernehmen
      </PrimaryCta>
    </Sheet>
  );
}

export function SwapReview({ w }: { w: Wallet }) {
  return (
    <Screen>
      <Header onBack={w.back}>
        <HeaderTitle>Swap prüfen</HeaderTitle>
      </Header>
      <View style={[{ gap: 8 }, p(18, 16, 0)]}>
        {w.swapSteps.map((s) => (
          <View key={s.n} style={[styles.row, { gap: 13, borderRadius: 20, backgroundColor: '#141418' }, p(14, 16)]}>
            <View style={[styles.center, { width: 30, height: 30, borderRadius: 15, backgroundColor: IND }]}>
              <Txt style={[f(900, 13), { color: '#FFFFFF' }]}>{s.n}</Txt>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Txt style={f(800, 15)}>{s.title}</Txt>
              <Txt style={[f(800, 12), { marginTop: 3, color: MUTED }]}>{s.sub}</Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 10, marginHorizontal: 16 }}>
        <KvRows rows={w.swapRevRows} pad={[11, 4]} />
      </View>
      <Cta>
        <PrimaryCta onClick={w.swapConfirm}>{w.confirmCta}</PrimaryCta>
      </Cta>
    </Screen>
  );
}

/** CSS `antheaSpin`: 0.9 s linear rotation. */
function Spinner() {
  const [turn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(turn, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: nativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [turn]);
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />;
}

export function Status({ w }: { w: Wallet }) {
  const extra = useBottomExtra();
  return (
    <Screen style={[{ alignItems: 'center' }, p(90, 22, 0)]}>
      <View style={[styles.center, { width: 96, height: 96, borderRadius: 48, backgroundColor: w.stDone ? IND : '#141418' }]}>
        {w.stDone ? <Icon name="check" color="#FFFFFF" size={42} weight={3} /> : <Spinner />}
      </View>
      <Txt accessibilityRole="header" style={[f(900, 28), { marginTop: 26, letterSpacing: -0.6, textAlign: 'center' }]}>
        {w.stTitle}
      </Txt>
      <Txt style={[f(700, 14.5, 1.5), { marginTop: 10, color: MUTED, maxWidth: 300, textAlign: 'center' }]}>{w.stSub}</Txt>
      <View style={{ width: '100%', marginTop: 26 }}>
        <KvRows rows={w.stRows} pad={[11, 4]} />
      </View>
      <View style={{ marginTop: 'auto', width: '100%', paddingBottom: 34 + extra, gap: 10 }}>
        <BigBtn variant="secondary" onPress={w.openExplorer} style={{ height: 56 }} textStyle={f(800, 15.5)}>
          Im Explorer ansehen
        </BigBtn>
        <BigBtn variant="primary" onPress={w.goHome}>
          Fertig
        </BigBtn>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  quoteTrack: { marginTop: 10, height: 3, borderRadius: 2, backgroundColor: '#1E1E23', overflow: 'hidden' },
  flip: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -22,
    marginTop: -22,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#1E1E23',
    borderWidth: 4,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: { width: 44, height: 44, borderRadius: 22, borderWidth: 4, borderColor: 'rgba(167,155,255,.25)', borderTopColor: ACC },
});
