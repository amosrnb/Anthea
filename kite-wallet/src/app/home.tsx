import { explorerTxUrl } from '@anthea/wallet-core';
import { Redirect, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { BalanceChart } from '../components/BalanceChart';
import { IconButton } from '../components/Buttons';
import { Icon, type IconName } from '../components/Icon';
import { Txt } from '../components/Txt';
import {
  ASSETS,
  CHAINS,
  RANGES,
  formatAmount,
  formatPct,
  formatUsd,
  rangeCaption,
  shortAddress,
  type Asset,
  type Range,
} from '../lib/data';
import { seriesChange, usePortfolioHistory } from '../lib/use-market';
import { colors } from '../lib/theme';
import { useWallet, type SentTx } from '../lib/wallet-context';

type Action = { label: string; icon: IconName; primary?: boolean; onPress: () => void };

export default function Home() {
  const insets = useSafeAreaInsets();
  const { status, balances, prices, backedUp, lock, network, balanceError, refreshing, refreshBalances, sent } = useWallet();
  const [range, setRange] = useState<Range>('1D');

  const loaded = CHAINS.every((c) => balances[c] !== null);
  const amounts = useMemo(
    () => (loaded ? { ethereum: Number(balances.ethereum), solana: Number(balances.solana) } : null),
    [loaded, balances.ethereum, balances.solana],
  );
  const history = usePortfolioHistory(amounts, range);
  const values = useMemo(() => history.points?.map((p) => p[1]) ?? null, [history.points]);

  if (status !== 'unlocked') return <Redirect href="/" />;

  const total = amounts && prices ? CHAINS.reduce((sum, c) => sum + amounts[c] * prices[c].usd, 0) : null;
  const change = seriesChange(history.points);
  const down = !!change && change.abs < 0;

  const actions: Action[] = [
    { label: 'Send', icon: 'send', primary: true, onPress: () => router.push('/send-receive?mode=send') },
    { label: 'Receive', icon: 'receive', onPress: () => router.push('/send-receive?mode=receive') },
    { label: 'Swap', icon: 'swap', onPress: () => router.push('/swap') },
  ];

  const lockNow = () => {
    lock();
    router.replace('/unlock');
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 30) + 10 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing && loaded} onRefresh={refreshBalances} tintColor={colors.muted} />}
    >
      <View style={styles.header}>
        <IconButton icon="lock" label="Lock wallet" onPress={lockNow} />
        <View style={[styles.account, { backgroundColor: colors.glass }]}>
          <Avatar />
          <Txt size={15} ls={-0.2}>Main wallet</Txt>
        </View>
        <IconButton icon="settings" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <View style={styles.balanceCard}>
        <View style={{ alignItems: 'center', gap: 10, paddingTop: 6, paddingBottom: 2 }}>
          <Txt size={44} weight={900} ls={0.5} tabular style={{ lineHeight: 48 }}>{total === null ? '—' : formatUsd(total)}</Txt>
          {change && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: colors.accentTint, borderRadius: 11, paddingVertical: 4, paddingHorizontal: 9 }}>
                <Txt size={12} tabular color={down ? colors.neg : colors.accentText}>{formatPct(change.pct)}</Txt>
              </View>
              <Txt size={12.5} color={colors.muted}>{down ? '-' : '+'}{formatUsd(Math.abs(change.abs))} {rangeCaption(range)}</Txt>
            </View>
          )}
          {network === 'testnet' && (
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Test network. Open settings to change network."
              style={{ backgroundColor: colors.glass, borderRadius: 11, paddingVertical: 4, paddingHorizontal: 9 }}
            >
              <Txt size={11} ls={0.8} color={colors.accentText}>TESTNET · SEPOLIA + DEVNET</Txt>
            </Pressable>
          )}
          {balanceError && (
            <Txt size={12} color={colors.neg} style={{ textAlign: 'center' }}>{balanceError} Pull down to retry.</Txt>
          )}
          {!backedUp && (
            <Pressable
              onPress={() => router.push('/settings/backup')}
              accessibilityRole="button"
              style={{ backgroundColor: colors.accentTint, borderRadius: 11, paddingVertical: 4, paddingHorizontal: 9 }}
            >
              <Txt size={12} color={colors.neg}>Not backed up · Back up now</Txt>
            </Pressable>
          )}
        </View>
        <BalanceChart values={values} />
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

      <View style={styles.actions}>
        {actions.map((a) => (
          <Pressable key={a.label} onPress={a.onPress} accessibilityRole="button" style={({ pressed }) => [styles.action, pressed && { opacity: 0.85 }]}>
            <View style={[styles.actionCircle, { backgroundColor: a.primary ? colors.accent : colors.chip }]}>
              <Icon name={a.icon} size={26} strokeWidth={2.6} color={a.primary ? colors.white : colors.ink} />
            </View>
            <Txt size={12.5} color={colors.muted}>{a.label}</Txt>
          </Pressable>
        ))}
      </View>

      {sent.length > 0 && (
        <View style={styles.list}>
          {sent.slice(0, 5).map((tx, i) => <SentRow key={tx.hash} tx={tx} first={i === 0} />)}
        </View>
      )}

      <View style={styles.list}>
        {CHAINS.map((c, i) => (
          <AssetRow
            key={c}
            a={ASSETS[c]}
            balance={amounts?.[c] ?? (balances[c] === null ? null : Number(balances[c]))}
            price={prices?.[c].usd ?? null}
            first={i === 0}
            onPress={() => router.push(`/token?chain=${c}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const TX_STATUS: Record<SentTx['status'], { label: string; color: string }> = {
  pending: { label: 'PENDING', color: colors.muted },
  confirmed: { label: 'CONFIRMED', color: colors.accentText },
  failed: { label: 'FAILED', color: colors.neg },
};

/** A transaction sent this session; opens it in the block explorer. */
function SentRow({ tx, first }: { tx: SentTx; first: boolean }) {
  const a = ASSETS[tx.chain];
  const st = TX_STATUS[tx.status];
  return (
    <Pressable
      onPress={() => Linking.openURL(explorerTxUrl(tx.chain, tx.hash, tx.network))}
      accessibilityRole="link"
      accessibilityLabel={`Sent ${tx.amount} ${a.symbol}, ${tx.status}. Open in block explorer.`}
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: first ? 'transparent' : colors.divider },
        pressed && { backgroundColor: 'rgba(255,255,255,.03)' },
      ]}
    >
      <View style={[styles.mark, { backgroundColor: colors.chip }]}>
        <Icon name="send" size={18} strokeWidth={2.2} color={colors.ink} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={15} tabular numberOfLines={1}>Sent {tx.amount} {a.symbol}</Txt>
        <Txt size={12.5} tabular color={colors.muted} style={{ marginTop: 4 }}>To {shortAddress(tx.to)}</Txt>
      </View>
      <Txt size={10.5} ls={0.8} color={st.color}>{st.label}</Txt>
    </Pressable>
  );
}

function AssetRow({ a, balance, price, first, onPress }: {
  a: Asset;
  balance: number | null;
  price: number | null;
  first: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${a.name}, ${balance === null ? 'loading' : formatAmount(balance, a)}`}
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: first ? 'transparent' : colors.divider },
        pressed && { backgroundColor: 'rgba(255,255,255,.03)' },
      ]}
    >
      <View style={[styles.mark, { backgroundColor: a.markBg }]}>
        <View style={styles.markShine} />
        <Txt size={15} weight={900} color={a.markInk}>{a.mark}</Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Txt size={15.5} numberOfLines={1} style={{ flexShrink: 1 }}>{a.name}</Txt>
          <View style={styles.tag}>
            <Txt size={9.5} ls={0.6} color={colors.muted}>{a.symbol}</Txt>
          </View>
        </View>
        <Txt size={12.5} tabular color={colors.muted} style={{ marginTop: 4 }}>{balance === null ? '—' : formatAmount(balance, a)}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt size={15.5} tabular>{balance === null || price === null ? '—' : formatUsd(balance * price)}</Txt>
        <Txt size={12.5} tabular color={colors.muted} style={{ marginTop: 4 }}>{price === null ? '—' : formatUsd(price)}</Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingHorizontal: 18 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, paddingVertical: 6, paddingLeft: 6, paddingRight: 14 },
  balanceCard: { marginTop: 18, marginHorizontal: 16, paddingTop: 22, paddingHorizontal: 22, paddingBottom: 18 },
  ranges: { flexDirection: 'row', gap: 5, marginTop: 14, padding: 4 },
  range: { flex: 1, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rangeOn: {
    backgroundColor: '#2A2A32',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 12, paddingHorizontal: 16 },
  action: { width: 80, alignItems: 'center', gap: 9 },
  actionCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  list: { marginTop: 22, marginHorizontal: 16, borderRadius: 26, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1 },
  mark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  markShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.14)' },
  tag: { backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6 },
});
