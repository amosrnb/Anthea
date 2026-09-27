import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { ACC, IND } from '../data';
import {
  BigBtn,
  Btn,
  Chip,
  Cta,
  DIM,
  f,
  Grid,
  Header,
  HeaderTitle,
  KvRows,
  Mark,
  MUTED,
  Notice,
  Overline,
  p,
  PrimaryCta,
  Screen,
  TEXTAREA,
  TNUM,
  Txt,
  useBottomExtra,
  webOnly,
  WHITE,
} from '../ui';
import { WarnIcon } from '../ui/icons';
import type { Wallet } from '../useWallet';
import { SEED_INPUT_PROPS } from './Onboarding';
import { Tag } from './Portfolio';

/**
 * Lets the address wrap between any two characters, like the prototype's `word-break: break-all` (native Text only
 * breaks at spaces). Display only: never copy or share this string, it contains zero-width spaces.
 */
const breakAnywhere = (text: string) => text.split('').join('\u200B');

const TwoLineTitle = ({ title, sub }: { title: string; sub: string }) => (
  <View style={{ flexShrink: 1 }}>
    <HeaderTitle>{title}</HeaderTitle>
    <Txt style={[f(800, 12), { color: MUTED }]}>{sub}</Txt>
  </View>
);

/** QR matrix drawn as SVG cells inside the white 220 pt card (29 × 29 modules). */
function QrMatrix({ cells }: { cells: string[] }) {
  const n = Math.round(Math.sqrt(cells.length));
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${n} ${n}`} accessibilityLabel="QR-Code der Adresse">
      {cells.map((c, i) => (c === '#000000' ? <Rect key={i} x={i % n} y={Math.floor(i / n)} width={1.02} height={1.02} fill="#000000" /> : null))}
    </Svg>
  );
}

export function Receive({ w }: { w: Wallet }) {
  return (
    <Screen>
      <Header onBack={w.back} style={p(16, 18, 6)}>
        <HeaderTitle>Empfangen</HeaderTitle>
      </Header>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={[{ gap: 6 }, p(12, 16, 0)]}>
        {w.rcvAssets.map((a) => (
          <Chip key={a.label} {...a} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={[styles.row, { gap: 6 }, p(10, 16, 0)]}>
        <Txt style={[f(800, 11), { letterSpacing: 1.1, color: MUTED, paddingRight: 4 }]}>NETZWERK</Txt>
        {w.rcvNets.map((n) => (
          <Chip key={n.label} {...n} style={[{ borderRadius: 11 }, p(6, 11)]} textStyle={f(800, 12)} />
        ))}
      </ScrollView>
      <View style={[{ alignItems: 'center' }, p(20, 22, 0)]}>
        <View style={styles.qrCard}>
          <QrMatrix cells={w.qr} />
          <View style={styles.qrLogo} />
        </View>
        <Txt style={[f(800, 16, 1.5), { marginTop: 18, maxWidth: 300, textAlign: 'center', letterSpacing: 0.6 }, TNUM]}>{breakAnywhere(w.rcvAddr)}</Txt>
        <Txt style={[f(800, 12.5), { marginTop: 6, color: MUTED }]}>{w.rcvNote}</Txt>
      </View>
      <View style={[styles.warnBox, p(14, 16)]}>
        <View style={{ marginTop: 1 }}>
          <WarnIcon />
        </View>
        <Txt style={[f(800, 13.5, 1.45), { color: '#F2DDA4', flexShrink: 1 }]}>{w.rcvWarn}</Txt>
      </View>
      <Cta>
        <Grid cols={2} colGap={10}>
          <BigBtn variant="secondary" onPress={w.copyAddr} style={{ height: 58 }} textStyle={f(800, 15.5)}>
            Kopieren
          </BigBtn>
          <BigBtn variant="primary" onPress={w.shareAddr} style={{ height: 58 }} textStyle={f(900, 15.5)}>
            Teilen
          </BigBtn>
        </Grid>
      </Cta>
    </Screen>
  );
}

export function SendAsset({ w }: { w: Wallet }) {
  return (
    <Screen>
      <Header onBack={w.back} style={p(16, 18, 6)}>
        <HeaderTitle>Was möchtest du senden?</HeaderTitle>
      </Header>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={p(10, 16, 30)} showsVerticalScrollIndicator={false}>
        {w.sendAssets.map((h) => (
          <Btn key={h.id} onPress={h.onClick} style={[styles.row, { gap: 13 }, p(13, 4)]} hoverStyle={styles.rowHover}>
            <Mark size={42} radius={15} fontSize={15} bg={h.bg} ink={h.ink}>
              {h.mark}
            </Mark>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={[styles.row, { gap: 7 }]}>
                <Txt style={f(800, 15.5)}>{h.sym}</Txt>
                <Tag text={h.tag} ink={h.tagInk} bg={h.tagBg} />
              </View>
              <Txt style={[f(800, 12.5), { color: MUTED, marginTop: 4 }]}>{h.sub}</Txt>
            </View>
            <Txt style={[f(800, 15), TNUM]}>{h.value}</Txt>
          </Btn>
        ))}
      </ScrollView>
    </Screen>
  );
}

const Pill = ({ onClick, children }: { onClick: () => void; children: string }) => (
  <Btn onPress={onClick} style={[{ borderRadius: 12, backgroundColor: '#1E1E23' }, p(8, 13)]}>
    <Txt style={f(800, 13)}>{children}</Txt>
  </Btn>
);

export function SendTo({ w }: { w: Wallet }) {
  return (
    <Screen>
      <Header onBack={w.back} style={p(16, 18, 6)}>
        <TwoLineTitle title="Empfänger" sub={w.sendHead} />
      </Header>
      <View style={[{ marginTop: 14, marginHorizontal: 16, borderRadius: 20, backgroundColor: '#141418' }, p(14, 16)]}>
        <TextInput
          value={w.sTo}
          onChangeText={w.onTo}
          placeholder={w.toPlaceholder}
          placeholderTextColor={DIM}
          multiline
          accessibilityLabel="Empfängeradresse"
          {...SEED_INPUT_PROPS}
          contextMenuHidden={false}
          style={[f(800, 15, 1.45), styles.input, { height: 52 }, webOnly({ wordBreak: 'break-all' })]}
        />
        <View style={[styles.row, { gap: 8, marginTop: 6 }]}>
          <Pill onClick={w.pasteTo}>Einfügen</Pill>
          <Pill onClick={w.scanTo}>QR scannen</Pill>
        </View>
      </View>
      {w.toMsg && (
        <Notice bg={w.toMsg.bg} ink={w.toMsg.ink} style={{ marginTop: 10, marginHorizontal: 16 }}>
          {w.toMsg.text}
        </Notice>
      )}
      <Overline style={p(22, 20, 8)}>ZULETZT VERWENDET</Overline>
      <View style={{ paddingHorizontal: 16 }}>
        {w.recents.map((r) => (
          <Btn key={r.short} onPress={r.onClick} style={[styles.row, { gap: 12 }, p(10, 4)]}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: '#1E1E23' }} />
            <View>
              <Txt style={f(800, 15)}>{r.short}</Txt>
              <Txt style={[f(800, 12), { marginTop: 3, color: MUTED }]}>{r.note}</Txt>
            </View>
          </Btn>
        ))}
      </View>
      <Cta>
        <PrimaryCta onClick={w.toNext} enabled={w.toValid}>
          Weiter
        </PrimaryCta>
      </Cta>
    </Screen>
  );
}

export function SendAmount({ w }: { w: Wallet }) {
  const extra = useBottomExtra();
  return (
    <Screen>
      <Header onBack={w.back}>
        <TwoLineTitle title="Betrag" sub={'An ' + w.toShort} />
      </Header>
      <View style={[{ alignItems: 'center' }, p(18, 20, 0)]}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Txt style={[f(900, 44, 1), { letterSpacing: 0.5 }, TNUM]}>{w.amtMain}</Txt>
          <Txt style={[f(900, 20), { color: MUTED }]}>{w.amtUnit}</Txt>
        </View>
        <View style={[styles.row, { gap: 8, marginTop: 12 }]}>
          <Btn onPress={w.toggleFiat} style={[styles.smallPill, { backgroundColor: '#1E1E23' }]}>
            <Txt style={f(800, 12.5)}>≈ {w.amtAlt}</Txt>
          </Btn>
          <Btn onPress={w.setMax} style={[styles.smallPill, { backgroundColor: 'rgba(108,92,231,.14)' }]}>
            <Txt style={[f(800, 12.5), { color: ACC }]}>Max</Txt>
          </Btn>
        </View>
        <Txt style={[f(800, 12), { marginTop: 10, color: w.amtInfoInk }]}>{w.amtInfo}</Txt>
      </View>
      <Grid cols={3} colGap={8} style={p(16, 16, 0)}>
        {w.feeOpts.map((o) => (
          <Btn key={o.label} onPress={o.onClick} style={[styles.feeOpt, { borderColor: o.ring }]}>
            <Txt style={f(800, 13)}>{o.label}</Txt>
            <Txt style={[f(800, 12), { marginTop: 3, color: ACC }, TNUM]}>{o.cost}</Txt>
            <Txt style={[f(800, 11), { marginTop: 2, color: MUTED }]}>{o.time}</Txt>
          </Btn>
        ))}
      </Grid>
      <Grid cols={3} colGap={10} rowGap={4} style={[{ marginTop: 'auto' }, p(8, 30, 10)]}>
        {w.amtKeys.map((k, i) => (
          <Btn key={i} onPress={k.onClick} label={k.label || 'Löschen'} style={styles.amtKey} activeStyle={{ backgroundColor: '#1E1E23' }}>
            {k.label ? <Txt style={f(900, 24)}>{k.label}</Txt> : k.icon}
          </Btn>
        ))}
      </Grid>
      <View style={p(0, 16, 30 + extra)}>
        <PrimaryCta onClick={w.amtNext} enabled={w.amtValid}>
          Prüfen
        </PrimaryCta>
      </View>
    </Screen>
  );
}

export function SendReview({ w }: { w: Wallet }) {
  return (
    <Screen>
      <Header onBack={w.back}>
        <HeaderTitle>Prüfen</HeaderTitle>
      </Header>
      <View style={[{ alignItems: 'center' }, p(22, 20, 6)]}>
        <Txt style={[f(900, 36), { letterSpacing: 0.4 }, TNUM]}>{w.revAmount}</Txt>
        <Txt style={[f(800, 13), { marginTop: 6, color: MUTED }]}>{w.revFiat}</Txt>
      </View>
      <View style={{ marginTop: 12, marginHorizontal: 16 }}>
        <KvRows rows={w.revRows} pad={[12, 4]} breakAll />
      </View>
      {w.revWarns.map((n) => (
        <Notice key={n.text} bg={n.bg} ink={n.ink} style={{ marginTop: 8, marginHorizontal: 16 }}>
          {n.text}
        </Notice>
      ))}
      <Cta>
        <PrimaryCta onClick={w.sendConfirm}>{w.confirmCta}</PrimaryCta>
      </Cta>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowHover: { backgroundColor: 'rgba(255,255,255,.03)' },
  qrCard: { width: 220, height: 220, backgroundColor: WHITE, borderRadius: 24, padding: 13 },
  qrLogo: { position: 'absolute', top: 81, left: 81, width: 58, height: 58, borderRadius: 16, backgroundColor: IND, borderWidth: 5, borderColor: WHITE },
  warnBox: {
    marginTop: 18,
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    borderRadius: 18,
    backgroundColor: 'rgba(232,196,106,.1)',
  },
  input: TEXTAREA,
  smallPill: { borderRadius: 11, ...p(6, 11) },
  feeOpt: { borderWidth: 2, borderRadius: 18, backgroundColor: '#141418', alignItems: 'center', ...p(10, 8) },
  amtKey: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
