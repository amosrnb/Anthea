import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useWalletContext } from "./context/WalletContext";
import { SessionProvider } from "./context/SessionContext";
import { Welcome } from "./screens/Welcome";
import { CreateWallet } from "./screens/CreateWallet";
import { ImportWallet } from "./screens/ImportWallet";
import { Unlock } from "./screens/Unlock";
import { Home } from "./screens/Home";
import { Send } from "./screens/Send";
import { Receive } from "./screens/Receive";
import { Settings } from "./screens/Settings";
import { Backup } from "./screens/Backup";

export function App() {
  const { status } = useWalletContext();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="app-shell">
        <main className="app-main" />
      </div>
    );
  }

  // `status` flips to "unlocked" as soon as the vault is created/unlocked,
  // which happens *before* CreateWallet's own generating/secure/backup steps
  // run. Keying this branch on status alone would unmount CreateWallet mid-flow
  // the instant the vault exists; staying on the onboarding path keeps it
  // mounted until it explicitly navigates to /home itself.
  const onOnboardingPath = location.pathname.startsWith("/onboarding");

  if (status === "no-vault" || status === "locked" || (status === "unlocked" && onOnboardingPath)) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route
              path="/onboarding/create"
              element={status !== "locked" ? <CreateWallet /> : <Navigate to="/" replace />}
            />
            <Route
              path="/onboarding/import"
              element={status !== "locked" ? <ImportWallet /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={status === "locked" ? <Unlock /> : <Welcome />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/send" element={<Send />} />
            <Route path="/receive" element={<Receive />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/backup" element={<Backup />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </SessionProvider>
  );
}
