import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Cta } from '../components/Buttons';
import { Field, FlowScreen } from '../components/Flow';
import { Txt } from '../components/Txt';
import { colors } from '../lib/theme';
import { useWallet } from '../lib/wallet-context';

export default function Unlock() {
  const { status, unlock } = useWallet();
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (status === 'none') return <Redirect href="/" />;
  if (status === 'unlocked') return <Redirect href="/home" />;

  const submit = () => {
    if (unlock(pw)) {
      router.replace('/home');
      return;
    }
    setError('Wrong password. Try again.');
  };

  return (
    <FlowScreen
      eyebrow="WELCOME BACK"
      title="Unlock your wallet"
      sub="Enter the password you set on this device."
      footer={
        <>
          <Cta label="Unlock" onPress={submit} disabled={!pw} />
          <View style={{ alignItems: 'center', paddingTop: 4 }}>
            <Pressable onPress={() => router.push('/import')} accessibilityRole="button" hitSlop={8}>
              <Txt size={13} color={colors.accentText}>Forgot password? Restore with seed phrase</Txt>
            </Pressable>
          </View>
        </>
      }
    >
      <Field
        label="PASSWORD"
        value={pw}
        onChangeText={(t) => {
          setPw(t);
          setError(null);
        }}
        secureTextEntry
        placeholder="Password"
        autoFocus
        onSubmitEditing={submit}
        error={error}
      />
    </FlowScreen>
  );
}
