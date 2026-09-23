import { Redirect, router } from 'expo-router';

import { FlowScreen, WordQuiz } from '../../components/Flow';
import { useWallet } from '../../lib/wallet-context';

export default function CreateConfirm() {
  const { draft, saveVault, flash } = useWallet();
  if (!draft) return <Redirect href="/" />;

  const done = async () => {
    await saveVault(draft.mnemonic, draft.password, true);
    router.dismissAll();
    router.replace('/home');
    flash('Wallet created and backed up');
  };

  return (
    <FlowScreen
      eyebrow="STEP 3 OF 3"
      title="Confirm your backup"
      sub="Pick the right word for each position to show your backup is correct."
      onBack={() => router.back()}
    >
      <WordQuiz words={draft.mnemonic} onDone={done} />
    </FlowScreen>
  );
}
