import { Redirect, router } from 'expo-router';

import { Cta } from '../../components/Buttons';
import { FlowScreen, MnemonicGrid } from '../../components/Flow';
import { Txt } from '../../components/Txt';
import { colors } from '../../lib/theme';
import { useWallet } from '../../lib/wallet-context';

export default function CreateBackup() {
  const { draft, saveVault, flash } = useWallet();
  if (!draft) return <Redirect href="/" />;

  const later = async () => {
    await saveVault(draft.mnemonic, draft.password, false);
    router.dismissAll();
    router.replace('/home');
    flash('Wallet created · back it up in Settings');
  };

  return (
    <FlowScreen
      eyebrow="STEP 2 OF 3"
      title="Write down your seed phrase"
      sub="These 12 words are the only way to recover your wallet. Write them down in order and keep them offline."
      onBack={() => router.back()}
      footer={
        <>
          <Cta label="I've written it down" onPress={() => router.push('/create/confirm')} />
          <Cta label="Back up later" variant="secondary" onPress={later} />
        </>
      }
    >
      <MnemonicGrid words={draft.mnemonic} />
      <Txt size={13} lh={1.6} color={colors.muted} style={{ marginTop: 16, marginHorizontal: 4 }}>
        Never share it. Anyone with these words can take your funds. Demo phrase: this prototype does not create real keys.
      </Txt>
    </FlowScreen>
  );
}
