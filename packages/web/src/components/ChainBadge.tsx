import type { ChainId } from "@anthea/wallet-core";
import { CHAIN_META } from "../lib/chains";
import styles from "./ChainBadge.module.css";

export function ChainBadge({ chainId }: { chainId: ChainId }) {
  const meta = CHAIN_META[chainId];
  return (
    <span className={styles.badge}>
      <span className={styles.dot} style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
