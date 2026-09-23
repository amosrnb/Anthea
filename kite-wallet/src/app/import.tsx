import { router } from 'expo-router';
import { useState } from 'react';

import { Cta } from '../components/Buttons';
import { Field, FlowScreen } from '../components/Flow';
import { parseMnemonic } from '../lib/data';
import { passwordError } from '../lib/password';
import { useWallet } from '../lib/wallet-context';

export default function ImportWallet() {
  const { saveVault, flash, status } = useWallet();
  const [phrase, setPhrase] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);

  const words = parseMnemonic(phrase);
  const phraseError = words ? null : 'Enter 12 or 24 words separated by spaces.';
  const pwError = passwordError(pw, confirm);

  const submit = async () => {
    setTouched(true);
    if (!words || pwError) return;
    await saveVault(words, pw, true);
    router.dismissAll();
    router.replace('/home');
    flash('Wallet imported');
  };

  return (
    <FlowScreen
      eyebrow="IMPORT"
      title="Import with seed phrase"
      sub={
        status === 'locked'
          ? 'This replaces the wallet stored on this device. Set a new password to encrypt it.'
          : 'Enter your 12 or 24 word phrase, then set a password to encrypt it on this device.'
      }
      onBack={() => router.back()}
      footer={<Cta label="Import wallet" onPress={submit} disabled={touched && (!!phraseError || !!pwError)} />}
    >
      <Field
        label="SEED PHRASE"
        value={phrase}
        onChangeText={setPhrase}
        multiline
        placeholder="word1 word2 word3 …"
        autoFocus
        error={touched ? phraseError : null}
      />
      <Field label="PASSWORD" value={pw} onChangeText={setPw} secureTextEntry placeholder="At least 8 characters" />
      <Field
        label="CONFIRM PASSWORD"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        placeholder="Repeat password"
        onSubmitEditing={submit}
        error={touched ? pwError : null}
      />
    </FlowScreen>
  );
}
