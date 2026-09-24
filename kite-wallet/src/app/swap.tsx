import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cta, Eyebrow, IconButton } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { SizeSlider } from '../components/SizeSlider';
import { Txt } from '../components/Txt';
import { ASSETS, formatAmount, formatUsd, type Asset, type ChainId } from '../lib/data';
import { goHome } from '../lib/nav';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

function TokenPill({ a }: { a: Asset }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillMark, { backgroundColor: a.markBg }]}>
        <Txt size={12} weight={900} color={a.markInk}>{a.mark}</Txt>
      </View>
      <Txt size={14.5}>{a.symbol}</Txt>
    </View>
  );
}

/**
 * Swap preview. ETH ↔ SOL is a cross-chain swap, which needs a bridge/swap
 * provider that isn't integrated yet, so this quotes at the live market rate
 * and doesn't submit anything.
 */
export default function Swap() {
  const insets = useSafeAreaInsets();
  const { status, balances, prices } = useWallet();
  const [from, setFrom] = useState<ChainId>('ethereum');
  const [pct, setPct] = useState(25);

  if (status !== 'unlocked') return <Redirect href="/" />;

  const to: ChainId = from === 'ethereum' ? 'solana' : 'ethereum';
  const pay = ASSETS[from];
  const get = ASSETS[to];
  const balanceFrom = Number(balances[from] ?? 0);
  const balanceTo = Number(balances[to] ?? 0);
  const amt = (balanceFrom * pct) / 100;
  const rate = prices ? prices[from].usd / prices[to].usd : null;
  const out = rate === null ? 0 : amt * rate;

  const details = [
    { k: 'Rate', v: rate === null ? '—' : `1 ${pay.symbol} = ${Number(rate.toFixed(get.decimals))} ${get.symbol}`, ink: colors.ink },
    { k: 'Route', v: 'Preview at market price', ink: colors.muted },
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
            <Txt size={11.5} tabular color={colors.muted}>Balance {balances[from] === null ? '—' : formatAmount(balanceFrom, pay)}</Txt>
          </View>
          <View style={styles.amountRow}>
            <Txt size={36} weight={900} ls={0.4} tabular style={{ flex: 1 }} numberOfLines={1}>{Number(amt.toFixed(pay.decimals))}</Txt>
            <TokenPill a={pay} />
          </View>
          <Txt size={13} tabular color={colors.muted} style={{ marginTop: 10 }}>{prices ? formatUsd(amt * prices[from].usd) : '—'}</Txt>
        </View>

        <View style={styles.flipWrap} pointerEvents="box-none">
          <Pressable
            onPress={() => setFrom(to)}
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
            <Txt size={11.5} tabular color={colors.muted}>Balance {balances[to] === null ? '—' : formatAmount(balanceTo, get)}</Txt>
          </View>
          <View style={styles.amountRow}>
            <Txt size={36} weight={900} ls={0.4} tabular color={colors.accent} style={{ flex: 1 }} numberOfLines={1}>{Number(out.toFixed(get.decimals))}</Txt>
            <TokenPill a={get} />
          </View>
          <Txt size={13} tabular color={colors.muted} style={{ marginTop: 10 }}>{prices ? formatUsd(out * prices[to].usd) : '—'}</Txt>
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
        <Txt size={12.5} lh={1.5} color={colors.muted} style={{ textAlign: 'center', marginBottom: 12, marginHorizontal: 8 }}>
          Swaps between Ethereum and Solana aren&apos;t live yet. This is a preview at the current market price.
        </Txt>
        <Cta label="Swaps coming soon" disabled />
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
