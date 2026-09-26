import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { IND, POS } from '../data';
import {
  AreaChart,
  BackButton,
  Blurred,
  Btn,
  Chip,
  Cta,
  DIM,
  f,
  Grid,
  IconBtn,
  Mark,
  MUTED,
  p,
  RangeTabs,
  Screen,
  Scroll,
  TNUM,
  Txt,
  webOnly,
  WHITE,
} from '../ui';
import { LockIcon, ScanIcon, SearchIcon } from '../ui/icons';
import type { Wallet } from '../useWallet';

export function Home({ w }: { w: Wallet }) {
  return (
    <Scroll>
      <View style={[styles.spaceRow, p(16, 18, 0)]}>
        <IconBtn onPress={w.goScan} label="QR scannen" hover>
          <ScanIcon color={WHITE} />
        </IconBtn>
        <View style={[styles.row, { gap: 8 }]}>
          <View style={{ width: 22, height: 22, borderRadius: 8, backgroundColor: IND }} />
          <Txt style={[f(900, 17), { letterSpacing: -0.2 }]}>Anthea</Txt>
          {w.testnet && (
            <View style={[{ backgroundColor: 'rgba(232,196,106,.14)', borderRadius: 6 }, p(3, 6)]}>
              <Txt style={[f(900, 9.5), { letterSpacing: 0.8, color: '#E8C46A' }]}>TESTNETZ</Txt>
            </View>
          )}
        </View>
        <IconBtn onPress={w.lockNow} label="Sperren" hover>
          <LockIcon size={17} color={WHITE} weight={2} />
        </IconBtn>
      </View>

      <View style={[{ alignItems: 'center', gap: 10 }, p(30, 22, 0)]}>
        <Txt style={[f(800, 12), { letterSpacing: 1.2, color: MUTED }]}>GESAMTWERT</Txt>
        <Blurred on={w.privacy} radius={10}>
          <Txt style={[f(900, 44, 1), { letterSpacing: 0.5 }, TNUM]}>{w.total}</Txt>
        </Blurred>
        <View style={[styles.row, { gap: 8 }]}>
          <View style={[styles.deltaPill, p(4, 9)]}>
            <Txt style={[f(800, 12), TNUM, { color: w.totalDeltaInk }]}>{w.totalDelta}</Txt>
          </View>
          <Txt style={[f(800, 12.5), { color: MUTED }]}>
            {w.totalAbs} · {w.hRangeLabel}
          </Txt>
        </View>
      </View>

      <View style={p(14, 22, 0)}>
        <AreaChart id="antheaFill" paths={w.hChart} viewH={64} height={64} opacity={0.28} />
        <RangeTabs ranges={w.hRanges} height={30} marginTop={12} />
      </View>

      <View style={[{ flexDirection: 'row', justifyContent: 'center', gap: 34 }, p(22, 16, 0)]}>
        {w.actions.map((a) => (
          <Btn key={a.label} onPress={a.onClick} style={{ alignItems: 'center', gap: 9 }}>
            <View style={[styles.center, { width: 58, height: 58, borderRadius: 29, backgroundColor: a.bg }]}>{a.icon}</View>
            <Txt style={[f(800, 12.5), { color: MUTED }]}>{a.label}</Txt>
          </Btn>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={[{ gap: 7 }, p(24, 16, 8)]}>
        {w.netChips.map((c) => (
          <Chip key={c.label} {...c} />
        ))}
      </ScrollView>

      <View style={{ marginHorizontal: 16, marginBottom: 130 }}>
        {w.holdings.map((h) => (
          <Btn key={h.id} onPress={h.onClick} style={[styles.row, { gap: 13 }, p(13, 4)]} hoverStyle={styles.rowHover}>
            <Mark size={42} radius={15} fontSize={15} bg={h.bg} ink={h.ink}>
              {h.mark}
            </Mark>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={[styles.row, { gap: 7 }]}>
                <Txt numberOfLines={1} style={[f(800, 15.5), { flexShrink: 1 }]}>
                  {h.name}
                </Txt>
                <Tag text={h.tag} ink={h.tagInk} bg={h.tagBg} />
              </View>
              <Txt style={[f(800, 12.5), { color: MUTED, marginTop: 4 }, TNUM]}>{h.sub}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Blurred on={w.privacy} radius={10}>
                <Txt style={[f(800, 15.5), TNUM]}>{h.value}</Txt>
              </Blurred>
              <Txt style={[f(800, 12.5), { color: h.chgInk, marginTop: 4 }, TNUM]}>{h.chg}</Txt>
            </View>
          </Btn>
        ))}
        <Txt style={[f(700, 11.5), { color: DIM }, p(14, 4, 0)]}>Preise: CoinGecko, Fallback DefiLlama · Stand 09:41</Txt>
      </View>
    </Scroll>
  );
}

export const Tag = ({ text, ink, bg }: { text: string; ink: string; bg: string }) => (
  <View style={[{ backgroundColor: bg, borderRadius: 6 }, p(3, 6)]}>
    <Txt style={[f(800, 9.5), { letterSpacing: 0.5, color: ink }]}>{text}</Txt>
  </View>
);

export function Markets({ w }: { w: Wallet }) {
  return (
    <Scroll>
      <View style={[styles.spaceRow, { alignItems: 'flex-end' }, p(22, 20, 0)]}>
        <Txt accessibilityRole="header" style={[f(900, 28), { letterSpacing: -0.7 }]}>
          Märkte
        </Txt>
        <View style={[styles.row, { gap: 6 }]}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: POS }} />
          <Txt style={[f(800, 12), { color: MUTED }]}>Live · alle 30 s</Txt>
        </View>
      </View>
      <View style={[styles.row, styles.search]}>
        <SearchIcon color={MUTED} />
        <TextInput
          value={w.mSearch}
          onChangeText={w.onSearch}
          placeholder="Coin suchen"
          placeholderTextColor={DIM}
          accessibilityLabel="Coin suchen"
          autoCorrect={false}
          style={[f(800, 15), styles.searchInput]}
        />
      </View>
      <View style={[styles.row, { gap: 7 }, p(14, 16, 6)]}>
        {w.mTabs.map((t) => (
          <Chip key={t.label} {...t} />
        ))}
      </View>
      <View style={{ marginHorizontal: 16, marginBottom: 130 }}>
        {w.coins.map((c) => (
          <Btn key={c.id} onPress={c.onClick} style={[styles.row, { gap: 12 }, p(12, 4)]} hoverStyle={styles.rowHover}>
            <Mark size={40} radius={14} fontSize={14} bg={c.bg} ink={c.ink}>
              {c.mark}
            </Mark>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt style={f(800, 15)}>{c.name}</Txt>
              <Txt style={[f(800, 12), { marginTop: 3, color: MUTED }]}>
                {c.sym} · #{c.rank}
              </Txt>
            </View>
            <Svg width={64} height={24} viewBox="0 0 64 24">
              <Path d={c.spark} fill="none" stroke={c.chgInk} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <View style={{ width: 92, alignItems: 'flex-end' }}>
              <Txt style={[f(800, 14.5), TNUM]}>{c.price}</Txt>
              <Txt style={[f(800, 12), { marginTop: 3, color: c.chgInk }, TNUM]}>{c.chg}</Txt>
            </View>
          </Btn>
        ))}
        {w.coins.length === 0 && <Txt style={[f(700, 14, 1.5), { color: MUTED, textAlign: 'center' }, p(40, 20)]}>{w.coinsEmptyText}</Txt>}
      </View>
    </Scroll>
  );
}

const SmallBtn = ({ onClick, primary, children }: { onClick: () => void; primary?: boolean; children: string }) => (
  <Btn onPress={onClick} style={[styles.center, { height: 54, borderRadius: 20, backgroundColor: primary ? IND : '#141418' }]}>
    <Txt style={[f(primary ? 900 : 800, 14.5), { color: primary ? '#FFFFFF' : WHITE }]}>{children}</Txt>
  </Btn>
);

export function CoinDetail({ w }: { w: Wallet }) {
  const c = w.coin;
  return (
    <Screen>
      <View style={[styles.spaceRow, p(16, 18, 0)]}>
        <BackButton onClick={w.back} />
        <View style={[styles.row, { gap: 8 }]}>
          <Mark size={26} radius={9} fontSize={12} bg={c.bg} ink={c.ink}>
            {c.mark}
          </Mark>
          <Txt style={f(900, 17)}>{c.name}</Txt>
        </View>
        <IconBtn onPress={w.toggleWatch} label="Watchlist">
          {w.starIcon}
        </IconBtn>
      </View>
      <View style={[{ alignItems: 'center', gap: 10 }, p(26, 22, 0)]}>
        <Txt style={[f(900, 40, 1), { letterSpacing: 0.4 }, TNUM]}>{c.price}</Txt>
        <View style={[styles.row, { gap: 8 }]}>
          <View style={[styles.deltaPill, p(4, 9)]}>
            <Txt style={[f(800, 12), { color: w.cChartInk }]}>{w.cChartDelta}</Txt>
          </View>
          <Txt style={[f(800, 12.5), { color: MUTED }]}>{w.cRangeLabel}</Txt>
        </View>
      </View>
      <View style={p(18, 22, 0)}>
        <AreaChart id="antheaFill2" paths={w.cChart} viewH={120} height={150} opacity={0.26} />
        <RangeTabs ranges={w.cRanges} height={32} marginTop={14} />
      </View>
      <Grid cols={2} colGap={16} rowGap={18} style={p(24, 26, 0)}>
        {w.coinStats.map((s) => (
          <View key={s.k}>
            <Txt style={[f(800, 11), { letterSpacing: 1.1, color: MUTED }]}>{s.k}</Txt>
            <Txt style={[f(800, 15), { marginTop: 6 }, TNUM]}>{s.v}</Txt>
          </View>
        ))}
      </Grid>
      <Cta>
        {w.coinSupported ? (
          <Grid cols={3} colGap={8}>
            <SmallBtn onClick={w.coinReceive}>Empfangen</SmallBtn>
            <SmallBtn onClick={w.coinSend}>Senden</SmallBtn>
            <SmallBtn onClick={w.coinSwap} primary>
              Swappen
            </SmallBtn>
          </Grid>
        ) : (
          <Txt style={[f(700, 13), { textAlign: 'center', color: MUTED, padding: 16 }]}>Dieses Netzwerk wird in Anthea nicht unterstützt.</Txt>
        )}
      </Cta>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  spaceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', justifyContent: 'center' },
  rowHover: { backgroundColor: 'rgba(255,255,255,.03)' },
  deltaPill: { backgroundColor: 'rgba(108,92,231,.14)', borderRadius: 11 },
  search: { marginTop: 16, marginHorizontal: 16, gap: 10, height: 46, borderRadius: 16, backgroundColor: '#141418', paddingHorizontal: 14 },
  searchInput: { flex: 1, padding: 0, color: WHITE, ...webOnly({ outlineStyle: 'none' }) },
});
