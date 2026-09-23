import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { IconButton } from '../components/Buttons';
import { Icon, type IconName } from '../components/Icon';
import { Txt } from '../components/Txt';
import { ASSETS, CHAINS, formatAmount, formatUsd, type Asset } from '../lib/data';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

type Action = { label: string; icon: IconName; primary?: boolean; onPress: () => void };

export default function Home() {
  const insets = useSafeAreaInsets();
  const { status, balances, backedUp, lock } = useWallet();

  if (status !== 'unlocked') return <Redirect href="/" />;

  const total = CHAINS.reduce((sum, c) => sum + balances[c] * ASSETS[c].usdPrice, 0);

  const actions: Action[] = [
    { label: 'Send', icon: 'send', primary: true, onPress: () => router.push('/send-receive?mode=send') },
    { label: 'Receive', icon: 'receive', onPress: () => router.push('/send-receive?mode=receive') },
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
          <Txt size={44} weight={900} ls={0.5} tabular style={{ lineHeight: 48 }}>{formatUsd(total)}</Txt>
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

      <View style={styles.list}>
        {CHAINS.map((c, i) => (
          <AssetRow
            key={c}
            a={ASSETS[c]}
            balance={balances[c]}
            first={i === 0}
            onPress={() => router.push(`/send-receive?mode=send&chain=${c}`)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function AssetRow({ a, balance, first, onPress }: { a: Asset; balance: number; first: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${a.name}, ${formatAmount(balance, a)}, send`}
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
        <Txt size={12.5} tabular color={colors.muted} style={{ marginTop: 4 }}>{formatAmount(balance, a)}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt size={15.5} tabular>{formatUsd(balance * a.usdPrice)}</Txt>
        <Txt size={12.5} tabular color={colors.muted} style={{ marginTop: 4 }}>{formatUsd(a.usdPrice)}</Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingHorizontal: 18 },
  account: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, paddingVertical: 6, paddingLeft: 6, paddingRight: 14 },
  balanceCard: { marginTop: 18, marginHorizontal: 16, paddingTop: 22, paddingHorizontal: 22, paddingBottom: 18 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 12, paddingHorizontal: 16 },
  action: { width: 80, alignItems: 'center', gap: 9 },
  actionCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  list: { marginTop: 22, marginHorizontal: 16, borderRadius: 26, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1 },
  mark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  markShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.14)' },
  tag: { backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6 },
});
