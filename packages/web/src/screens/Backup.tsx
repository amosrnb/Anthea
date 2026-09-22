import { useNavigate } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { BackupFlow } from "../components/BackupFlow";
import { useWalletContext } from "../context/WalletContext";
import { markBackedUp } from "../lib/backup";

export function Backup() {
  const { activeWallet, activeWalletId } = useWalletContext();
  const navigate = useNavigate();

  if (!activeWallet || !activeWalletId) {
    return <p className="muted">No wallet selected yet.</p>;
  }

  return (
    <div className="stack">
      <ScreenHeader back="/settings" />
      <BackupFlow
        mnemonic={activeWallet.mnemonic}
        onDone={() => {
          markBackedUp(activeWalletId);
          navigate("/settings");
        }}
      />
    </div>
  );
}
