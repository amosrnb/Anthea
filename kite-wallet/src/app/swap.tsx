import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cta, Eyebrow, IconButton } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { SizeSlider } from '../components/SizeSlider';
import { Txt } from '../components/Txt';
import { USDC_BALANCE, USDC_TO_WBTC } from '../lib/data';
import { goHome } from '../lib/nav';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

function TokenPill({ symbol, mark, bg, ink = colors.ink }: { symbol: string; mark: string; bg: string; ink?: string }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillMark, { backgroundColor: bg }]}>
        <Txt size={12} weight={900} color={ink}>{mark}</Txt>
      </View>
      <Txt size={14.5}>{symbol}</Txt>
      <Icon name="chevronDown" size={10} color="rgba(247,247,245,.5)" strokeWidth={2.2} />
    </View>
  );
}

export default function Swap() {
  const insets = useSafeAreaInsets();
  const { flash } = useWallet();
  const [pct, setPct] = useState(25);

  const amt = (USDC_BALANCE * pct) / 100;
  const details = [
    { k: 'Rate', v: `1 USDC = ${USDC_TO_WBTC} WBTC`, ink: colors.ink },
    { k: 'Network fee', v: 'Free', ink: colors.accentText },
    { k: 'Route', v: 'Base · 2 hops', ink: colors.ink },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 30) }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.headerIcon}>
            <Icon name="swap" size={18} color={colors.accent} strokeWidth={2} />
          </View>
          <Txt size={22} weight={900} ls={-0.7} accessibilityRole="header">Swap</Txt>
        </View>
        <IconButton icon="close" size={13} color="rgba(247,247,245,.7)" strokeWidth={2.1} onPress={goHome} label="Close" />
      </View>

      <View style={{ marginHorizontal: 16, gap: 8 }}>
        <View style={{ paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16 }}>
          <View style={styles.between}>
            <Eyebrow>YOU PAY</Eyebrow>
            <Txt size={11.5} tabular color={colors.muted}>Balance 2,683.10</Txt>
          </View>
          <View style={styles.amountRow}>
            <Txt size={36} weight={900} ls={0.4} tabular style={{ flex: 1 }}>{amt.toFixed(2)}</Txt>
            <TokenPill symbol="USDC" mark="$" bg="#4B7BE5" />
          </View>
          <Txt size={13} tabular color={colors.muted} style={{ marginTop: 10 }}>${amt.toFixed(2)}</Txt>
        </View>

        <View style={styles.flipWrap} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch tokens"
            style={({ pressed }) => [styles.flip, { backgroundColor: pressed ? colors.controlPressed : colors.control }]}
          >
            <Icon name="flip" size={17} color={colors.accent} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={{ padding: 18 }}>
          <View style={styles.between}>
            <Eyebrow>YOU RECEIVE</Eyebrow>
            <Txt size={11.5} color={colors.muted}>Balance 0.00</Txt>
          </View>
          <View style={styles.amountRow}>
            <Txt size={36} weight={900} ls={0.4} tabular color={colors.accent} style={{ flex: 1 }}>{(amt * USDC_TO_WBTC).toFixed(6)}</Txt>
            <TokenPill symbol="WBTC" mark="B" bg="#D8862A" ink="#1A0E00" />
          </View>
          <Txt size={13} tabular color={colors.muted} style={{ marginTop: 10 }}>${(amt * 0.994).toFixed(2)}</Txt>
        </View>
      </View>

      <View style={{ paddingTop: 16, paddingHorizontal: 16 }}>
        <View style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
          <View style={styles.between}>
            <Eyebrow>SIZE</Eyebrow>
            <Txt size={13} tabular>{pct}%</Txt>
          </View>
          <SizeSlider value={pct} onChange={setPct} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
            {[25, 50, 75, 100].map((p) => {
              const on = pct === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPct(p)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.pctChip, { backgroundColor: on ? colors.accentTint : colors.raised }]}
                >
                  <Txt size={12.5} tabular color={on ? colors.accentText : colors.muted}>{p === 100 ? 'Max' : `${p}%`}</Txt>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 10, paddingHorizontal: 16 }}>
        <View style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
          {details.map((d, i) => (
            <View key={d.k} style={[styles.between, styles.detail, { borderTopColor: i === 0 ? 'transparent' : colors.divider }]}>
              <Txt size={13.5} color={colors.muted}>{d.k}</Txt>
              <Txt size={13.5} tabular color={d.ink}>{d.v}</Txt>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingTop: 16, paddingHorizontal: 16 }}>
        <Cta
          label="Review swap"
          onPress={() => flash('Swap submitted')}
          trailing={<Icon name="send" size={17} color={colors.white} strokeWidth={2.2} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 26, paddingHorizontal: 18, paddingBottom: 16 },
  headerIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.control, borderRadius: 16, paddingVertical: 7, paddingLeft: 7, paddingRight: 12 },
  pillMark: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  flipWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 4 },
  flip: { width: 44, height: 44, borderRadius: 16, borderWidth: 4, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  pctChip: { flex: 1, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detail: { paddingVertical: 12, borderTopWidth: 1 },
});
