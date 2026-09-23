import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { BalanceChart } from '../components/BalanceChart';
import { Chip, IconButton } from '../components/Buttons';
import { DOCK_HEIGHT, Dock, dockBottom } from '../components/Dock';
import { Icon, type IconName } from '../components/Icon';
import { Txt } from '../components/Txt';
import { BALANCE, FILTERS, HOLDINGS, RANGES, rangeCaption, type Filter, type Holding } from '../lib/data';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

type Action = { label: string; icon: IconName; primary?: boolean; onPress: () => void };

export default function Home() {
  const insets = useSafeAreaInsets();
  const { wallet, flash } = useWallet();
  const [nav, setNav] = useState(0);
  const [filter, setFilter] = useState<Filter>('All');
  const [rangeLabel, setRangeLabel] = useState('1D');

  const range = RANGES.find((r) => r.label === rangeLabel) ?? RANGES[1];
  const down = range.delta.startsWith('-');
  const holdings = HOLDINGS.filter((h) => filter === 'All' || h.kind === filter);
  const goSwap = () => router.push('/swap');

  const actions: Action[] = [
    { label: 'Send', icon: 'send', primary: true, onPress: () => router.push('/send-receive?mode=send') },
    { label: 'Receive', icon: 'receive', onPress: () => router.push('/send-receive?mode=receive') },
    { label: 'Buy', icon: 'plus', onPress: () => flash('Buy coming soon') },
    { label: 'Swap', icon: 'swap', onPress: goSwap },
  ];

  const bottom = dockBottom(insets.bottom);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: bottom + DOCK_HEIGHT + 50 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton icon="scan" label="Scan QR code" />
          <Pressable
            onPress={() => router.push('/accounts')}
            accessibilityRole="button"
            accessibilityLabel={`Account ${wallet.handle}, switch account`}
            style={({ pressed }) => [styles.account, { backgroundColor: pressed ? colors.glassPressed : colors.glass }]}
          >
            <Avatar />
            <Txt size={15} ls={-0.2}>{wallet.handle}</Txt>
            <Icon name="chevronDown" size={11} color="rgba(247,247,245,.5)" strokeWidth={2.2} />
          </Pressable>
          <IconButton icon="history" label="Transaction history" />
        </View>

        <View style={styles.balanceCard}>
          <View style={{ alignItems: 'center', gap: 10, paddingTop: 6, paddingBottom: 2 }}>
            <Txt size={44} weight={900} ls={0.5} tabular style={{ lineHeight: 48 }}>{BALANCE}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: colors.accentTint, borderRadius: 11, paddingVertical: 4, paddingHorizontal: 9 }}>
                <Txt size={12} tabular color={down ? colors.neg : colors.accentText}>{range.delta}</Txt>
              </View>
              <Txt size={12.5} color={colors.muted}>{range.abs} {rangeCaption(range.label)}</Txt>
            </View>
          </View>
          <BalanceChart range={range} />
          <View style={styles.ranges}>
            {RANGES.map((r) => {
              const on = r.label === rangeLabel;
              return (
                <Pressable
                  key={r.label}
                  onPress={() => setRangeLabel(r.label)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.range, on && styles.rangeOn]}
                >
                  <Txt size={12} tabular color={on ? colors.ink : colors.muted}>{r.label}</Txt>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => <Chip key={f} label={f} on={filter === f} onPress={() => setFilter(f)} />)}
        </ScrollView>

        <View style={styles.list}>
          {holdings.map((h, i) => (
            <HoldingRow key={h.name} h={h} first={i === 0} onPress={() => flash(`${h.name} · ${h.usd}`)} />
          ))}
        </View>
      </ScrollView>

      <Dock active={nav} onTab={setNav} onSwap={goSwap} bottom={bottom} />
    </View>
  );
}

function HoldingRow({ h, first, onPress }: { h: Holding; first: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: first ? 'transparent' : colors.divider },
        pressed && { backgroundColor: 'rgba(255,255,255,.03)' },
      ]}
    >
      <View style={[styles.mark, { backgroundColor: h.markBg }]}>
        <View style={styles.markShine} />
        <Txt size={15} weight={900} color={h.markInk}>{h.mark}</Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Txt size={15.5} numberOfLines={1} style={{ flexShrink: 1 }}>{h.name}</Txt>
          <View style={styles.tag}>
            <Txt size={9.5} ls={0.6} color={colors.muted}>{h.tag}</Txt>
          </View>
        </View>
        <Txt size={12.5} tabular color={colors.muted} style={{ marginTop: 4 }}>{h.sub}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt size={15.5} tabular>{h.usd}</Txt>
        <Txt size={12.5} tabular color={h.up ? colors.pos : colors.neg} style={{ marginTop: 4 }}>{h.chg}</Txt>
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
  actions: { flexDirection: 'row', gap: 8, paddingTop: 12, paddingHorizontal: 16 },
  action: { flex: 1, alignItems: 'center', gap: 9 },
  actionCircle: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 7, paddingTop: 22, paddingHorizontal: 16, paddingBottom: 10 },
  list: { marginHorizontal: 16, borderRadius: 26, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1 },
  mark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  markShine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.14)' },
  tag: { backgroundColor: 'rgba(255,255,255,.06)', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6 },
});
