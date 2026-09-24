import { ETHEREUM_DECIMALS, SOLANA_DECIMALS, explorerTxUrl, formatUnits, parseUnits } from '@anthea/wallet-core';
import * as Clipboard from 'expo-clipboard';
import { Redirect, useLocalSearchParams } from 'expo-router';
import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';

import { Chip, Cta, Eyebrow, IconButton } from '../components/Buttons';
import { ErrorText, Sheet } from '../components/Flow';
import { Txt } from '../components/Txt';
import {
  ASSETS,
  CHAINS,
  formatAmount,
  formatUsd,
  isValidAddress,
  shortAddress,
  truncateDecimals,
  type ChainId,
} from '../lib/data';
import { goHome } from '../lib/nav';
import { colors, fonts } from '../lib/theme';
import { friendlyError, useWallet } from '../lib/wallet-context';

/** On-chain decimals: wei for ETH, lamports for SOL. */
const UNITS: Record<ChainId, number> = { ethereum: ETHEREUM_DECIMALS, solana: SOLANA_DECIMALS };
/** Placeholder amount for a fee quote before the user has typed one. */
const QUOTE_AMOUNT = '0.001';

/** Exact base units for a typed amount, or null if it isn't a number. */
function toUnits(input: string, chain: ChainId): bigint | null {
  const v = input.replace(',', '.').trim();
  if (!/^\d*\.?\d*$/.test(v) || v === '' || v === '.') return null;
  try {
    return parseUnits(v, UNITS[chain]);
  } catch {
    return null;
  }
}

type Mode = 'send' | 'receive';

export default function SendReceive() {
  const insets = useSafeAreaInsets();
  const { status } = useWallet();
  const params = useLocalSearchParams<{ mode?: string; chain?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'receive' ? 'receive' : 'send');
  const [chain, setChain] = useState<ChainId>(params.chain === 'solana' ? 'solana' : 'ethereum');

  if (status !== 'unlocked') return <Redirect href="/" />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

        <View style={styles.tabs}>
          {CHAINS.map((c) => <Chip key={c} label={ASSETS[c].symbol} on={chain === c} onPress={() => setChain(c)} />)}
        </View>

        {mode === 'send' ? <SendPane key={chain} chain={chain} /> : <ReceivePane chain={chain} />}
      </View>
    </KeyboardAvoidingView>
  );
}

function SendPane({ chain }: { chain: ChainId }) {
  const { balances, addresses, prices, network, estimateFee, send } = useWallet();
  const a = ASSETS[chain];
  const dec = UNITS[chain];
  const price = prices?.[chain].usd ?? null;
  const balanceText = balances[chain];
  const balanceUnits = balanceText === null ? null : parseUnits(balanceText, dec);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentHash, setSentHash] = useState<string | null>(null);

  const toTrim = to.trim();
  const toValid = isValidAddress(chain, toTrim);
  const units = toUnits(amount, chain);
  const amountText = units === null ? null : formatUnits(units, dec);
  const value = units === null ? 0 : Number(amountText);

  // Live fee quote for this recipient and amount (own address and a small
  // amount stand in until they're entered), debounced while typing.
  const feeTo = toValid ? toTrim : addresses[chain];
  const feeAmount = units !== null && units > 0n ? amountText! : QUOTE_AMOUNT;
  const feeKey = `${network}:${chain}:${feeTo}:${feeAmount}`;
  const [fee, setFee] = useState<{ key: string; value: string | null; error: string | null } | null>(null);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      estimateFee(chain, feeTo, feeAmount)
        .then((v) => live && setFee({ key: feeKey, value: v, error: null }))
        .catch((e) => live && setFee({ key: feeKey, value: null, error: friendlyError(e) }));
    }, 400);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [chain, feeTo, feeAmount, feeKey, estimateFee]);
  // Keep showing the previous quote while a new one loads.
  const feeText = fee?.value ?? null;
  const feeUnits = feeText === null ? null : parseUnits(feeText, dec);
  const feeLabel = chain === 'ethereum' ? 'Network fee (max)' : 'Network fee';

  const enough = units !== null && balanceUnits !== null && feeUnits !== null && units + feeUnits <= balanceUnits;
  const addrError = toTrim && !toValid ? `Enter a valid ${a.name} address.` : null;
  const amtError = amount
    ? units === null || units <= 0n
      ? 'Enter an amount above 0.'
      : balanceUnits !== null && feeUnits !== null && !enough
        ? `Not enough ${a.symbol} to cover the amount and network fee.`
        : null
    : null;
  const ready = toValid && units !== null && units > 0n && enough;

  const max = () => {
    if (balanceUnits === null || feeUnits === null) return;
    const spendable = balanceUnits > feeUnits ? balanceUnits - feeUnits : 0n;
    setAmount(truncateDecimals(formatUnits(spendable, dec), 9));
  };

  const confirm = async () => {
    setSending(true);
    setSendError(null);
    try {
      setSentHash(await send(chain, toTrim, amountText!));
    } catch (e) {
      setSendError(friendlyError(e));
    } finally {
      setSending(false);
    }
  };

  const feeValue = feeText === null ? (fee?.error ? 'Unavailable' : 'Estimating…') : formatAmount(Number(feeText), a);
  const details = [
    { k: 'Network', v: a.networks[network] },
    { k: feeLabel, v: feeText !== null && price !== null ? `${feeValue} (${formatUsd(Number(feeText) * price)})` : feeValue },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.toField}>
          <Eyebrow>TO</Eyebrow>
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder={chain === 'ethereum' ? '0x… address' : 'Solana address'}
            placeholderTextColor={colors.muted}
            selectionColor={colors.accent}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Recipient address"
            style={styles.toInput}
          />
        </View>
        {addrError && <View style={{ marginHorizontal: 16 }}><ErrorText>{addrError}</ErrorText></View>}

        <View style={{ marginHorizontal: 16, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 16 }}>
          <View style={styles.between}>
            <Eyebrow>AMOUNT</Eyebrow>
            <Pressable
              onPress={max}
              disabled={balanceUnits === null || feeUnits === null}
              accessibilityRole="button"
              accessibilityLabel="Use maximum amount"
              hitSlop={8}
            >
              <Txt size={11.5} tabular color={colors.muted}>
                Balance {balanceText === null ? '—' : formatAmount(Number(balanceText), a)} · <Txt size={11.5} color={colors.accentText}>Max</Txt>
              </Txt>
            </Pressable>
          </View>
          <View style={styles.amountRow}>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.muted}
              selectionColor={colors.accent}
              keyboardType="decimal-pad"
              accessibilityLabel={`Amount in ${a.symbol}`}
              style={styles.amountInput}
            />
            <View style={styles.pill}>
              <View style={[styles.pillMark, { backgroundColor: a.markBg }]}>
                <Txt size={12} weight={900} color={a.markInk}>{a.mark}</Txt>
              </View>
              <Txt size={14.5}>{a.symbol}</Txt>
            </View>
          </View>
          <Txt size={13} tabular color={colors.muted} style={{ marginTop: 10 }}>
            {price === null ? '—' : formatUsd(value * price)}
            {network === 'testnet' ? ' · test coins have no value' : ''}
          </Txt>
          {amtError && <ErrorText>{amtError}</ErrorText>}
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ paddingVertical: 4, paddingHorizontal: 18 }}>
            {details.map((d, i) => (
              <View key={d.k} style={[styles.between, styles.detail, { borderTopColor: i === 0 ? 'transparent' : colors.divider }]}>
                <Txt size={13.5} color={colors.muted}>{d.k}</Txt>
                <Txt size={13.5} tabular color={d.k === 'Network' && network === 'testnet' ? colors.accentText : colors.ink}>{d.v}</Txt>
              </View>
            ))}
          </View>
          {fee?.error && feeText === null && <View style={{ marginHorizontal: 4 }}><ErrorText>{fee.error}</ErrorText></View>}
        </View>
      </ScrollView>

      <View style={{ paddingTop: 14, paddingHorizontal: 16 }}>
        <Cta label="Review" disabled={!ready} onPress={() => setReviewing(true)} />
      </View>

      {reviewing && !sentHash && (
        <Sheet title="Review send" sub="Check the details. Transactions can't be reversed once sent." onClose={() => !sending && setReviewing(false)}>
          <View style={{ paddingHorizontal: 4 }}>
            {[
              { k: 'To', v: shortAddress(toTrim) },
              { k: 'Network', v: a.networks[network] },
              { k: 'Amount', v: formatAmount(value, a) },
              { k: 'Value', v: price === null ? '—' : formatUsd(value * price) },
              { k: feeLabel, v: feeValue },
              { k: 'Total', v: feeText === null ? '—' : formatAmount(value + Number(feeText), a) },
            ].map((d, i) => (
              <View key={d.k} style={[styles.between, styles.detail, { borderTopColor: i === 0 ? 'transparent' : colors.divider }]}>
                <Txt size={13.5} color={colors.muted}>{d.k}</Txt>
                <Txt size={13.5} tabular>{d.v}</Txt>
              </View>
            ))}
          </View>
          {sendError && <ErrorText>{sendError}</ErrorText>}
          <View style={{ gap: 10, marginTop: 16 }}>
            <Cta label={sending ? 'Sending…' : 'Confirm and send'} disabled={sending || !ready} onPress={confirm} />
            <Cta label="Edit" variant="secondary" disabled={sending} onPress={() => setReviewing(false)} />
          </View>
        </Sheet>
      )}

      {sentHash && (
        <Sheet
          title="Sent"
          sub={`${formatAmount(value, a)} is on its way to ${shortAddress(toTrim)}. It usually confirms within ${chain === 'ethereum' ? 'a minute' : 'a few seconds'}; the status shows on Home.`}
          onClose={goHome}
        >
          <View style={{ gap: 10 }}>
            <Cta label="Done" onPress={goHome} />
            <Cta label="View in block explorer" variant="secondary" onPress={() => Linking.openURL(explorerTxUrl(chain, sentHash, network))} />
          </View>
        </Sheet>
      )}
    </View>
  );
}

function ReceivePane({ chain }: { chain: ChainId }) {
  const { flash, addresses, network, requestAirdrop } = useWallet();
  const a = ASSETS[chain];
  const address = addresses[chain];
  const [airdropping, setAirdropping] = useState(false);
  const [airdropError, setAirdropError] = useState<string | null>(null);
  // High error correction so the logo in the centre doesn't stop it scanning.
  const qr = useMemo(() => QRCode.create(address, { errorCorrectionLevel: 'H' }).modules, [address]);

  const copy = async () => {
    await Clipboard.setStringAsync(address);
    flash('Address copied');
  };

  const airdrop = async () => {
    setAirdropping(true);
    setAirdropError(null);
    try {
      await requestAirdrop();
      flash('1 test SOL requested');
    } catch (e) {
      const msg = friendlyError(e);
      setAirdropError(/rate limit|busy|429/i.test(msg) ? 'The Devnet faucet is busy. Use the web faucet instead.' : msg);
    } finally {
      setAirdropping(false);
    }
  };

  const openFaucet = async () => {
    await Clipboard.setStringAsync(address);
    flash('Address copied. Paste it in the faucet');
    Linking.openURL(a.faucetUrl);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingHorizontal: 16 }}>
      <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
        <View style={styles.qr}>
          <Svg width={222} height={222} viewBox={`0 0 ${qr.size} ${qr.size}`}>
            {Array.from(qr.data, (dark, i) =>
              dark ? <Rect key={i} x={i % qr.size} y={Math.floor(i / qr.size)} width={1.02} height={1.02} fill="#000000" /> : null,
            )}
          </Svg>
          <View style={styles.qrLogo}>
            <View style={{ width: 18, height: 18, borderRadius: 6, backgroundColor: colors.white }} />
          </View>
        </View>
        <Txt size={18} tabular style={{ marginTop: 20 }}>{shortAddress(address)}</Txt>
        <Txt size={12.5} color={network === 'testnet' ? colors.accentText : colors.muted} style={{ marginTop: 6 }}>{a.networks[network]}</Txt>
      </View>
      <Txt size={13} lh={1.6} color={colors.muted} style={{ marginTop: 16, marginHorizontal: 4, textAlign: 'center' }}>
        {network === 'testnet'
          ? `You're on the test network: this address receives free test ${a.symbol} on ${a.networks.testnet}. The same address also works on mainnet, but the app only shows test balances until you switch in Settings.`
          : `Only send ${a.symbol} on ${a.networks.mainnet} to this address. Assets sent from other networks may be lost permanently.`}
      </Txt>
      {airdropError && <ErrorText>{airdropError}</ErrorText>}
      <View style={{ marginTop: 'auto', alignSelf: 'stretch', gap: 10 }}>
        {network === 'testnet' && chain === 'solana' && (
          <Cta label={airdropping ? 'Requesting…' : 'Get 1 test SOL'} disabled={airdropping} onPress={airdrop} />
        )}
        {network === 'testnet' && (
          <Cta label={`Open ${chain === 'ethereum' ? 'Sepolia' : 'Devnet'} faucet`} variant="secondary" onPress={openFaucet} />
        )}
        <Cta label="Copy address" variant="secondary" onPress={copy} />
      </View>
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
  tabs: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  toField: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16 },
  toInput: {
    flex: 1,
    minWidth: 0,
    outlineWidth: 0,
    minHeight: 40,
    borderRadius: 13,
    backgroundColor: colors.control,
    paddingHorizontal: 12,
    fontFamily: fonts[800],
    fontSize: 14.5,
    color: colors.ink,
  },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  amountInput: { flex: 1, minWidth: 0, outlineWidth: 0, fontFamily: fonts[900], fontSize: 36, letterSpacing: 0.4, color: colors.ink, padding: 0, fontVariant: ['tabular-nums'] },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.control, borderRadius: 16, paddingVertical: 7, paddingLeft: 7, paddingRight: 12 },
  pillMark: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  detail: { paddingVertical: 12, borderTopWidth: 1 },
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
