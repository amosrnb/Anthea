import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { Cta } from '../../components/Buttons';
import { Field, FlowScreen, MnemonicGrid, WordQuiz } from '../../components/Flow';
import { Txt } from '../../components/Txt';
import { colors } from '../../lib/theme';
import { useWallet } from '../../lib/wallet-context';

type Step = 'password' | 'show' | 'quiz';

export default function Backup() {
  const { status, mnemonic, backedUp, checkPassword, markBackedUp, flash } = useWallet();
  const [step, setStep] = useState<Step>('password');
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status !== 'unlocked') return <Redirect href="/" />;

  const reveal = async () => {
    if (busy || !pw) return;
    setBusy(true);
    const ok = await checkPassword(pw);
    setBusy(false);
    if (!ok) {
      setError('Wrong password. Try again.');
      return;
    }
    setStep('show');
  };

  const done = async () => {
    await markBackedUp();
    flash('Backup confirmed');
    router.back();
  };

  if (step === 'password') {
    return (
      <FlowScreen
        eyebrow={backedUp ? 'BACKED UP' : 'NOT BACKED UP'}
        title="Backup & recovery"
        sub="Enter your password to show your seed phrase. Make sure no one can see your screen."
        onBack={() => router.back()}
        footer={<Cta label="Show seed phrase" onPress={reveal} disabled={!pw || busy} />}
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
          onSubmitEditing={reveal}
          error={error}
        />
      </FlowScreen>
    );
  }

  if (step === 'show') {
    return (
      <FlowScreen
        eyebrow="SEED PHRASE"
        title="Your seed phrase"
        sub="Write these words down in order and store them offline. They're the only way to recover your wallet."
        onBack={() => setStep('password')}
        footer={
          <>
            <Cta label="Confirm backup" onPress={() => setStep('quiz')} />
            <Cta label="Done" variant="secondary" onPress={() => router.back()} />
          </>
        }
      >
        <MnemonicGrid words={mnemonic} />
        <Txt size={13} lh={1.6} color={colors.muted} style={{ marginTop: 16, marginHorizontal: 4 }}>
          Never share it. Anyone with these words can take your funds.
        </Txt>
      </FlowScreen>
    );
  }

  return (
    <FlowScreen eyebrow="SEED PHRASE" title="Confirm your backup" sub="Pick the right word for each position." onBack={() => setStep('show')}>
      <WordQuiz words={mnemonic} onDone={done} />
    </FlowScreen>
  );
}
