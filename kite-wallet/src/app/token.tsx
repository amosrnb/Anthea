import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cta, IconButton } from '../components/Buttons';
import { PriceChart } from '../components/PriceChart';
import { Txt } from '../components/Txt';
import { ASSETS, RANGES, formatAmount, formatPct, formatUsd, rangeCaption, type ChainId, type Range } from '../lib/data';
import { goHome } from '../lib/nav';
import { seriesChange, usePriceHistory } from '../lib/use-market';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

export default function Token() {
  const insets = useSafeAreaInsets();
  const { status, balances, prices, network } = useWallet();
  const params = useLocalSearchParams<{ chain?: string }>();
  const [range, setRange] = useState<Range>('1D');
  const chain: ChainId = params.chain === 'solana' ? 'solana' : 'ethereum';
  const history = usePriceHistory(chain, range);
  const values = useMemo(() => history.points?.map((p) => p[1]) ?? null, [history.points]);

  if (status !== 'unlocked') return <Redirect href="/" />;

  const a = ASSETS[chain];
  const balance = balances[chain] === null ? null : Number(balances[chain]);
  const price = prices?.[chain].usd ?? null;
  const change = seriesChange(history.points);
  const down = !!change && change.abs < 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 30) + 10 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconButton icon="back" label="Back" onPress={goHome} />
        <Txt size={15} ls={-0.2}>{a.name}</Txt>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.priceCard}>
        <View style={[styles.mark, { backgroundColor: a.markBg }]}>
          <Txt size={17} weight={900} color={a.markInk}>{a.mark}</Txt>
        </View>
        <Txt size={34} weight={900} ls={0.3} tabular style={{ marginTop: 12 }}>{price === null ? '—' : formatUsd(price)}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, minHeight: 24 }}>
          {change ? (
            <>
              <View style={{ backgroundColor: colors.accentTint, borderRadius: 11, paddingVertical: 4, paddingHorizontal: 9 }}>
                <Txt size={12} tabular color={down ? colors.neg : colors.accentText}>{formatPct(change.pct)}</Txt>
              </View>
              <Txt size={12.5} color={colors.muted}>{down ? '-' : '+'}{formatUsd(Math.abs(change.abs))} {rangeCaption(range)}</Txt>
            </>
          ) : (
            history.error && <Txt size={12.5} color={colors.muted}>Price history unavailable right now</Txt>
          )}
        </View>

        <PriceChart values={values} />

        <View style={styles.ranges}>
          {RANGES.map((r) => {
            const on = r === range;
            return (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.range, on && styles.rangeOn]}
              >
                <Txt size={12} tabular color={on ? colors.ink : colors.muted}>{r}</Txt>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.between}>
          <Txt size={13.5} color={colors.muted}>Your balance</Txt>
          <Txt size={14.5} tabular>{balance === null ? '—' : formatAmount(balance, a)}</Txt>
        </View>
        <View style={[styles.between, { marginTop: 12 }]}>
          <Txt size={13.5} color={colors.muted}>Value</Txt>
          <Txt size={14.5} tabular>{balance === null || price === null ? '—' : formatUsd(balance * price)}</Txt>
        </View>
        <View style={[styles.between, { marginTop: 12 }]}>
          <Txt size={13.5} color={colors.muted}>Network</Txt>
          <Txt size={13.5} color={network === 'testnet' ? colors.accentText : colors.ink}>{a.networks[network]}</Txt>
        </View>
      </View>

      <View style={styles.actions}>
        <Cta label="Send" style={{ flex: 1 }} onPress={() => router.push(`/send-receive?mode=send&chain=${chain}`)} />
        <Cta label="Swap" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/swap')} />
        <Cta label="Receive" variant="secondary" style={{ flex: 1 }} onPress={() => router.push(`/send-receive?mode=receive&chain=${chain}`)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingHorizontal: 18 },
  priceCard: { marginTop: 18, marginHorizontal: 16, paddingTop: 22, paddingHorizontal: 22, paddingBottom: 18, alignItems: 'center' },
  mark: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ranges: { flexDirection: 'row', gap: 5, marginTop: 14, padding: 4, alignSelf: 'stretch' },
  range: { flex: 1, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rangeOn: {
    backgroundColor: '#2A2A32',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  balanceCard: { marginTop: 16, marginHorizontal: 16, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20, marginHorizontal: 16 },
});
