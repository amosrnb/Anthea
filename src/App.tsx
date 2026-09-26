import { BlurView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { BackHandler, Platform, StyleSheet, View, type GestureResponderEvent, type ViewProps } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { prototypeProps } from './config';
import { IND, INK, NEG } from './data';
import { Activity, Reveal, Rpc, Settings, TxDetail } from './screens/Account';
import { Import, Pin, PinDots, PinPad, Seed, Verify, Warn, Welcome } from './screens/Onboarding';
import { CoinDetail, Home, Markets } from './screens/Portfolio';
import { SlippageSheet, Status, Swap, SwapReview } from './screens/Swap';
import { Receive, SendAmount, SendAsset, SendReview, SendTo } from './screens/Transfer';
import { Btn, f, FONT_FILES, isWeb, MUTED, Sheet, Txt, useBottomExtra } from './ui';
import { Icon, ToastCheck } from './ui/icons';
import { useWallet, type Screen, type Wallet, type WalletProps } from './useWallet';

const SCREENS: Record<Screen, ComponentType<{ w: Wallet }>> = {
  welcome: Welcome,
  warn: Warn,
  seed: Seed,
  verify: Verify,
  import: Import,
  pin: Pin,
  home: Home,
  markets: Markets,
  coin: CoinDetail,
  receive: Receive,
  sendAsset: SendAsset,
  sendTo: SendTo,
  sendAmt: SendAmount,
  sendReview: SendReview,
  swap: Swap,
  swapReview: SwapReview,
  status: Status,
  activity: Activity,
  tx: TxDetail,
  settings: Settings,
  rpc: Rpc,
  reveal: Reveal,
};

/**
 * Web preview only: the page renders a 390×844 iPhone surface with the iPhone's 47 pt top safe area,
 * so it can be compared 1:1 with the prototype. Native builds use the real safe-area insets.
 */
const WEB_TOP_INSET = 47;

function Dock({ w }: { w: Wallet }) {
  const extra = useBottomExtra();
  const item = (n: Wallet['navLeft'][number]) => (
    <Btn key={n.label} onPress={n.onClick} label={n.label} style={styles.dockItem}>
      {n.icon}
      <Txt style={[f(800, 10), { color: n.ink }]}>{n.label}</Txt>
    </Btn>
  );
  return (
    <View style={[styles.dock, { bottom: 24 + extra }]}>
      <BlurView tint="dark" intensity={100} style={styles.dockGlass} />
      <View style={styles.dockRow}>
        {w.navLeft.map(item)}
        <View style={{ width: 74, alignItems: 'center' }}>
          <Btn onPress={w.goSwap} label="Swappen" style={styles.dockSwap} hoverStyle={{ backgroundColor: '#7E70EB' }}>
            <Icon name="swap" color="#FFFFFF" size={24} weight={2.6} />
          </Btn>
        </View>
        {w.navRight.map(item)}
      </View>
    </View>
  );
}

const CheckBoxMark = () => <Icon name="check" color="#FFFFFF" size={14} weight={3} />;

function ResetSheet({ w }: { w: Wallet }) {
  return (
    <Sheet onClose={w.closeReset} scrim={0.6} z={30}>
      <Txt accessibilityRole="header" style={[f(900, 21), { marginTop: 16, marginHorizontal: 4, marginBottom: 6 }]}>
        Wallet zurücksetzen?
      </Txt>
      <Txt style={[f(700, 13.5, 1.5), { marginHorizontal: 4, color: MUTED }]}>
        Alle Schlüssel und Daten werden von diesem Gerät gelöscht. Ohne Phrase ist dein Guthaben verloren. Anthea kann sie nicht wiederherstellen.
      </Txt>
      <Btn onPress={w.toggleResetChk} role="checkbox" checked={w.resetChk} style={styles.resetCheck}>
        <View style={[styles.center, { width: 24, height: 24, borderRadius: 8, backgroundColor: w.resetChk ? NEG : '#2A2A32' }]}>
          {w.resetChk && <CheckBoxMark />}
        </View>
        <Txt style={[f(800, 14), { color: INK }]}>Ich habe meine Phrase gesichert</Txt>
      </Btn>
      <Btn onPress={w.doReset} style={[styles.center, styles.resetBtn, { opacity: w.resetChk ? 1 : 0.4 }]}>
        <Txt style={[f(900, 15.5), { color: '#2A0D08' }]}>Endgültig zurücksetzen</Txt>
      </Btn>
    </Sheet>
  );
}

/** PIN prompt shown before a transaction is signed; checks automatically after the 6th digit. */
function ConfirmSheet({ w }: { w: Wallet }) {
  return (
    <Sheet onClose={w.closeConfirm} scrim={0.6} z={35}>
      <Txt accessibilityRole="header" style={[f(900, 21), { marginTop: 16, marginHorizontal: 4, marginBottom: 4, textAlign: 'center' }]}>
        PIN eingeben
      </Txt>
      <Txt style={[f(700, 13.5, 1.5), { color: MUTED, textAlign: 'center' }]}>Signatur auf diesem Gerät</Txt>
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <PinDots dots={w.confirmDots} />
      </View>
      <Txt accessibilityRole="alert" style={[f(800, 13), { height: 18, marginTop: 10, color: NEG, textAlign: 'center' }]}>
        {w.confirmError}
      </Txt>
      <PinPad keys={w.confirmKeys} testIDPrefix="confirm-key" keyHeight={58} fontSize={24} rowGap={8} style={{ paddingTop: 6, paddingHorizontal: 24 }} />
    </Sheet>
  );
}

function Toast({ text }: { text: string }) {
  const extra = useBottomExtra();
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.toast, { bottom: 104 + extra }]}>
      <BlurView tint="dark" intensity={90} style={styles.toastGlass} />
      <View style={[styles.toastGlass, { backgroundColor: 'rgba(30,30,35,.95)' }]} />
      <View style={[styles.center, { width: 24, height: 24, borderRadius: 8, backgroundColor: IND }]}>
        <ToastCheck />
      </View>
      <Txt style={[f(800, 14, 1.35), { flexShrink: 1 }]}>{text}</Txt>
    </View>
  );
}

/**
 * Platform back navigation: Android back button/gesture via BackHandler, and on iOS a swipe right from the left
 * screen edge (like a native stack). Both call `onBack`, which returns false on root screens so Android can
 * leave the app.
 */
function useSystemBack(onBack: () => boolean): ViewProps {
  const back = useRef(onBack);
  const touch = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    back.current = onBack;
  });
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => back.current());
    return () => sub.remove();
  }, []);
  if (Platform.OS !== 'ios') return {};
  const delta = (e: GestureResponderEvent) => (touch.current ? { dx: e.nativeEvent.pageX - touch.current.x, dy: e.nativeEvent.pageY - touch.current.y } : null);
  return {
    onStartShouldSetResponderCapture: (e) => {
      touch.current = e.nativeEvent.pageX < 24 ? { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY } : null;
      return false;
    },
    onMoveShouldSetResponderCapture: (e) => {
      const d = delta(e);
      return !!d && d.dx > 12 && Math.abs(d.dy) < d.dx;
    },
    onResponderRelease: (e) => {
      const d = delta(e);
      touch.current = null;
      if (d && d.dx > 70) back.current();
    },
    onResponderTerminate: () => {
      touch.current = null;
    },
  };
}

function Device(props: WalletProps) {
  const w = useWallet(props);
  const insets = useSafeAreaInsets();
  const Current = SCREENS[w.screen];
  const backGesture = useSystemBack(w.systemBack);

  return (
    <View testID="device" style={[styles.device, { paddingTop: isWeb ? WEB_TOP_INSET : insets.top }]} {...backGesture}>
      <StatusBar style="light" />
      <Current w={w} />
      {w.showDock && <Dock w={w} />}
      {w.slipOpen && w.screen === 'swap' && <SlippageSheet w={w} />}
      {w.resetOpen && <ResetSheet w={w} />}
      {w.confirmOpen && <ConfirmSheet w={w} />}
      {w.toast && <Toast text={w.toast} />}
    </View>
  );
}

export default function App({ walletProps }: { walletProps?: WalletProps }) {
  const [fontsLoaded] = useFonts(FONT_FILES);
  const [props] = useState(() => walletProps ?? prototypeProps());
  return (
    <SafeAreaProvider style={styles.stage}>
      {fontsLoaded ? (
        <View style={isWeb ? styles.webFrame : styles.fill}>
          <Device {...props} />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#000000', alignItems: isWeb ? 'center' : 'stretch', justifyContent: 'center' },
  fill: { flex: 1 },
  webFrame: { width: 390, height: 844, overflow: 'hidden' },
  device: { flex: 1, backgroundColor: '#000000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  dock: { position: 'absolute', left: 18, right: 18, height: 66, borderRadius: 26, boxShadow: '0 18px 44px rgba(0,0,0,.55)', zIndex: 10 },
  dockGlass: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 26, overflow: 'hidden' },
  dockRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  dockItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  dockSwap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: IND,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 26px rgba(108,92,231,.32)',
  },
  resetCheck: { marginTop: 16, width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: '#141418' },
  resetBtn: { marginTop: 12, width: '100%', height: 54, borderRadius: 20, backgroundColor: NEG },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    boxShadow: '0 18px 44px rgba(0,0,0,.6)',
  },
  toastGlass: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 20, overflow: 'hidden' },
});
