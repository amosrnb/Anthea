import { Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Toast } from '../components/Toast';
import { colors } from '../lib/theme';
import { WalletProvider, useWallet } from '../lib/wallet-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ Nunito_800ExtraBold, Nunito_900Black });
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </SafeAreaProvider>
  );
}

/** Keeps the splash up until the local vault has been read, so returning users land on Unlock. */
function App() {
  const { status } = useWallet();
  const ready = status !== 'loading';

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="unlock" options={{ gestureEnabled: false }} />
        <Stack.Screen name="home" options={{ gestureEnabled: false }} />
      </Stack>
      <Toast />
    </View>
  );
}
