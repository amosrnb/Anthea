import { router } from 'expo-router';
import { useState } from 'react';

import { Cta } from '../../components/Buttons';
import { Field, FlowScreen } from '../../components/Flow';
import { demoMnemonic } from '../../lib/data';
import { passwordError } from '../../lib/password';
import { useWallet } from '../../lib/wallet-context';

export default function CreatePassword() {
  const { setDraft } = useWallet();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState(false);

  const error = passwordError(pw, confirm);
  const next = () => {
    setTouched(true);
    if (error) return;
    setDraft({ mnemonic: demoMnemonic(), password: pw });
    router.push('/create/backup');
  };

  return (
    <FlowScreen
      eyebrow="STEP 1 OF 3"
      title="Set a password"
      sub="It encrypts your wallet on this device and unlocks it next time. Anthea can't reset it for you."
      onBack={() => router.back()}
      footer={<Cta label="Continue" onPress={next} disabled={touched && !!error} />}
    >
      <Field label="PASSWORD" value={pw} onChangeText={setPw} secureTextEntry placeholder="At least 8 characters" autoFocus />
      <Field
        label="CONFIRM PASSWORD"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        placeholder="Repeat password"
        onSubmitEditing={next}
        error={touched ? error : null}
      />
    </FlowScreen>
  );
}
