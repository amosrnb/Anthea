import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { Chip, Cta, Eyebrow, IconButton, Swatch } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { Txt } from '../components/Txt';
import { NFT_COLORS, RECEIVE_ADDRESS, RECIPIENT, qrMatrix } from '../lib/data';
import { goHome } from '../lib/nav';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

type Mode = 'send' | 'receive';

export default function SendReceive() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'receive' ? 'receive' : 'send');

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 30) }}>
      <View style={styles.header}>
        <View style={styles.segment} accessibilityRole="tablist">
          {(['send', 'receive'] as const).map((m) => {
            const on = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[styles.segmentBtn, on && styles.segmentOn]}
              >
                <Txt size={14.5} color={on ? '#000000' : colors.muted}>{m === 'send' ? 'Send' : 'Receive'}</Txt>
              </Pressable>
            );
          })}
        </View>
        <IconButton icon="close" size={13} color="rgba(247,247,245,.7)" strokeWidth={2.1} onPress={goHome} label="Close" />
      </View>

      {mode === 'send' ? <SendPane /> : <ReceivePane />}
    </View>
  );
}

function SendPane() {
  const { flash } = useWallet();
  const [tab, setTab] = useState<'Tokens' | 'Collectibles'>('Collectibles');
  const [sel, setSel] = useState<number[]>([0, 1, 3]);
  const all = sel.length === NFT_COLORS.length;

  const toggle = (i: number) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const send = () => {
    flash(`Sent to ${RECIPIENT}`);
    goHome();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.toField}>
        <Eyebrow>TO</Eyebrow>
        <View style={styles.recipient}>
          <Swatch size={22} radius={8} color={colors.accent} />
          <Txt size={14.5}>{RECIPIENT}</Txt>
        </View>
        <View style={{ marginLeft: 'auto', width: 2, height: 20, backgroundColor: colors.accent }} />
      </View>

      <View style={styles.tabs}>
        {(['Tokens', 'Collectibles'] as const).map((t) => <Chip key={t} label={t} on={tab === t} onPress={() => setTab(t)} />)}
        <Pressable
          onPress={() => setSel(all ? [] : NFT_COLORS.map((_, i) => i))}
          accessibilityRole="button"
          style={{ marginLeft: 'auto' }}
        >
          <Txt size={13} color={colors.accentText}>{all ? 'Clear' : 'Select all'}</Txt>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {NFT_COLORS.map((c, i) => (
          <NftTile key={c} color={c} label={`nft art ${i + 1}`} on={sel.includes(i)} onPress={() => toggle(i)} />
        ))}
      </ScrollView>

      <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
        <Cta
          label={sel.length ? `Review ${sel.length} item${sel.length > 1 ? 's' : ''}` : 'Select items to send'}
          disabled={!sel.length}
          onPress={send}
        />
      </View>
    </View>
  );
}

/** Collectible placeholder: brand-tinted tile with diagonal stripes until real artwork is wired in. */
function NftTile({ color, label, on, onPress }: { color: string; label: string; on: boolean; onPress: () => void }) {
  const id = `stripes-${color.slice(1)}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      style={[styles.tile, { backgroundColor: color, borderColor: on ? colors.accent : 'transparent' }]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id={id} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect x={0} y={0} width={7} height={14} fill="rgba(255,255,255,.12)" />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      <Txt size={10} ls={0.4} color="rgba(0,0,0,.6)" style={styles.tileLabel}>{label}</Txt>
      <View style={[styles.check, { backgroundColor: on ? colors.white : 'rgba(255,255,255,.55)' }]}>
        {on && <Icon name="check" size={12} color={colors.accent} strokeWidth={2.4} />}
      </View>
    </Pressable>
  );
}

function ReceivePane() {
  const { flash } = useWallet();
  const cells = useMemo(() => qrMatrix(29), []);

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingHorizontal: 16 }}>
      <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
        <View style={styles.qr}>
          <Svg width={222} height={222} viewBox="0 0 29 29">
            {cells.map((dark, i) => (dark ? <Rect key={i} x={i % 29} y={Math.floor(i / 29)} width={1.02} height={1.02} fill="#000000" /> : null))}
          </Svg>
          <View style={styles.qrLogo}>
            <View style={{ width: 18, height: 18, borderRadius: 6, backgroundColor: colors.white }} />
          </View>
        </View>
        <Txt size={18} tabular style={{ marginTop: 20 }} selectable>{RECEIVE_ADDRESS}</Txt>
        <Txt size={12.5} color={colors.muted} style={{ marginTop: 6 }}>Ethereum · Base · Arbitrum</Txt>
      </View>
      <Txt size={13} lh={1.6} color={colors.muted} style={{ marginTop: 16, marginHorizontal: 4, textAlign: 'center' }}>
        Sending assets from other networks to this address may result in permanent loss.
      </Txt>
      <Cta label="Share address" variant="secondary" onPress={() => flash('Address copied')} style={{ marginTop: 'auto', alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, paddingHorizontal: 18, paddingBottom: 16 },
  segment: { flexDirection: 'row', gap: 4, borderRadius: 18, padding: 4 },
  segmentBtn: { borderRadius: 14, paddingVertical: 9, paddingHorizontal: 18 },
  segmentOn: {
    backgroundColor: colors.ink,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  toField: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16 },
  recipient: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.control, borderRadius: 13, paddingVertical: 6, paddingLeft: 6, paddingRight: 12 },
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16, paddingBottom: 8 },
  tile: { width: '47.5%', flexGrow: 1, aspectRatio: 1, borderRadius: 22, borderWidth: 2, overflow: 'hidden' },
  tileLabel: { position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center' },
  check: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  qr: { width: 250, height: 250, backgroundColor: colors.ink, borderRadius: 24, padding: 14, alignItems: 'center', justifyContent: 'center' },
  qrLogo: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.accent,
    borderWidth: 5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
