import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Eyebrow } from '../../components/Buttons';
import { FlowScreen } from '../../components/Flow';
import { Icon, type IconName } from '../../components/Icon';
import { Txt } from '../../components/Txt';
import { colors } from '../../lib/theme';
import { useWallet } from '../../lib/wallet-context';

function Row({ icon, title, sub, right, rightColor, first, onPress }: {
  icon: IconName;
  title: string;
  sub: string;
  right?: string;
  rightColor?: string;
  first?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: first ? 'transparent' : colors.divider },
        pressed && { backgroundColor: colors.raised },
      ]}
    >
      <View style={styles.icon}>
        <Icon name={icon} size={19} color={colors.ink} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt size={15.5}>{title}</Txt>
        <Txt size={12.5} color={colors.muted} style={{ marginTop: 3 }}>{sub}</Txt>
      </View>
      {right && <Txt size={11.5} color={rightColor ?? colors.muted}>{right}</Txt>}
      <Icon name="chevronRight" size={13} color="rgba(247,247,245,.35)" strokeWidth={2} />
    </Pressable>
  );
}

export default function Settings() {
  const { status, backedUp, lock } = useWallet();
  if (status !== 'unlocked') return <Redirect href="/" />;

  return (
    <FlowScreen eyebrow="ANTHEA" title="Settings" onBack={() => router.back()}>
      <View style={{ borderRadius: 26, overflow: 'hidden' }}>
        <Row
          first
          icon="check"
          title="Backup & recovery"
          sub="View or re-confirm your seed phrase"
          right={backedUp ? 'BACKED UP' : 'NOT BACKED UP'}
          rightColor={backedUp ? colors.accentText : colors.neg}
          onPress={() => router.push('/settings/backup')}
        />
        <Row
          icon="lock"
          title="Lock wallet"
          sub="Require your password to open Anthea"
          onPress={() => {
            lock();
            router.dismissAll();
            router.replace('/unlock');
          }}
        />
      </View>

      <View style={{ paddingHorizontal: 4, paddingTop: 26, paddingBottom: 10 }}>
        <Eyebrow>NON-CUSTODIAL</Eyebrow>
      </View>
      <Txt size={13} lh={1.6} color={colors.muted} style={{ marginHorizontal: 4 }}>
        Anthea is a non-custodial wallet. Your keys are created and kept only on this device, encrypted with your password. Anthea never sees your seed phrase or holds your funds, and can&apos;t recover them for you. If you lose both your password and your seed phrase, your funds can&apos;t be recovered.
      </Txt>
      <Txt size={13} lh={1.6} color={colors.muted} style={{ marginHorizontal: 4, marginTop: 12 }}>
        Prototype: balances, prices and transactions are simulated. No real keys are created and nothing is sent to a network.
      </Txt>
    </FlowScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1 },
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
});
