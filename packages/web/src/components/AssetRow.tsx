import type { MockAsset } from "../lib/mock";
import { formatUsd, usdValue } from "../lib/mock";
import { CHAIN_META } from "../lib/chains";
import styles from "./AssetRow.module.css";

interface AssetRowProps {
  asset: MockAsset;
  onClick?: () => void;
}

/** Reused across Home and the Send/Swap asset pickers, per the wallet-ux doc. */
export function AssetRow({ asset, onClick }: AssetRowProps) {
  const meta = CHAIN_META[asset.chainId];
  const content = (
    <>
      <span className={styles.mark} style={{ background: meta.color }}>
        {asset.symbol.slice(0, 1)}
      </span>
      <span className={styles.meta}>
        <span className={styles.name}>{asset.name}</span>
        <span className={styles.sub}>
          {asset.balance} {asset.symbol}
        </span>
      </span>
      <span className={styles.amounts}>
        <span className={`${styles.usd} tabular-nums`}>{formatUsd(usdValue(asset))}</span>
        <span className={`${styles.balance} tabular-nums`}>{meta.label}</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={styles.row} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className={styles.row}>{content}</div>;
}
