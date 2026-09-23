import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Eyebrow, IconButton, Swatch } from '../components/Buttons';
import { Txt } from '../components/Txt';
import { WALLETS, WALLET_TOTAL } from '../lib/data';
import { goHome } from '../lib/nav';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

export default function Accounts() {
  const insets = useSafeAreaInsets();
  const { walletIndex, setWalletIndex, wallet, flash } = useWallet();

  const switchTo = (i: number) => {
    setWalletIndex(i);
    goHome();
    flash(`Switched to ${WALLETS[i].name}`);
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 30) }}>
      <View style={{ paddingTop: 20, paddingHorizontal: 18 }}>
        <IconButton icon="back" size={15} strokeWidth={2.1} onPress={goHome} label="Back" />
      </View>

      <View style={styles.titleRow}>
        <View>
          <Eyebrow ls={1.4}>{`${WALLETS.length} ACCOUNTS`}</Eyebrow>
          <Txt size={32} weight={900} ls={0.4} tabular style={{ marginTop: 8 }} accessibilityRole="header">{WALLET_TOTAL}</Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.newBtn, { backgroundColor: pressed ? colors.glassPressed : colors.glass }]}
        >
          <Txt size={13.5}>New</Txt>
        </Pressable>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
          {WALLETS.slice(0, 3).map((w, i) => {
            const featured = i === 0;
            const ink = featured ? colors.white : colors.ink;
            return (
              <Pressable
                key={w.name}
                onPress={() => switchTo(i)}
                accessibilityRole="button"
                style={[styles.card, { backgroundColor: featured ? colors.accent : colors.chip }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Swatch size={26} radius={9} color={featured ? colors.white : w.color} />
                  <Txt size={10} ls={0.8} color={ink} style={{ opacity: 0.65 }}>{w.state}</Txt>
                </View>
                <View>
                  <Txt size={15} color={ink}>{w.name}</Txt>
                  <Txt size={16} tabular color={ink} style={{ marginTop: 3 }}>{w.bal}</Txt>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 18, paddingHorizontal: 16, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 4, paddingBottom: 10 }}>
          <Eyebrow>ALL ACCOUNTS</Eyebrow>
        </View>
        <View style={{ borderRadius: 26, overflow: 'hidden' }}>
          {WALLETS.map((w, i) => {
            const active = i === walletIndex;
            return (
              <Pressable
                key={w.name}
                onPress={() => switchTo(i)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: active || pressed ? colors.raised : 'transparent',
                    borderTopColor: i === 0 ? 'transparent' : colors.divider,
                  },
                ]}
              >
                <Swatch size={38} radius={13} color={w.color} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={15.5}>{w.name}</Txt>
                  <Txt size={12.5} color={colors.muted} style={{ marginTop: 3 }}>{w.addr}</Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt size={15} tabular>{w.bal}</Txt>
                  <Txt size={11.5} color={active ? colors.accentText : colors.muted} style={{ marginTop: 3 }}>{w.state}</Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
        <Pressable accessibilityRole="button" style={styles.importBtn}>
          <Txt size={14} color={colors.muted}>Import an account</Txt>
        </Pressable>
      </ScrollView>

      <View style={styles.signing}>
        <Swatch size={24} radius={8} color={colors.accent} />
        <Txt size={13} color={colors.muted}>
          Signing as <Txt size={13}>{wallet.name}</Txt>
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 18, paddingBottom: 16 },
  newBtn: { height: 40, paddingHorizontal: 16, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cards: { gap: 12, paddingHorizontal: 18, paddingBottom: 4 },
  card: {
    width: 176,
    height: 112,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 12 },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1 },
  importBtn: { height: 56, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  signing: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 14, paddingHorizontal: 16 },
});
