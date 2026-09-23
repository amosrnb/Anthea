import styles from "./AmountInput.module.css";

interface AmountInputProps {
  label: string;
  symbol: string;
  value: string;
  onChange: (value: string) => void;
  balanceLabel?: string;
  onMax?: () => void;
  fiatLabel?: string | undefined;
}

/** Large numeric entry + Max affordance + fiat-equivalent subtext, per the wallet-ux doc. */
export function AmountInput({ label, symbol, value, onChange, balanceLabel, onMax, fiatLabel }: AmountInputProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <span className={styles.label}>{label}</span>
        {balanceLabel && <span className={`${styles.balance} tabular-nums`}>{balanceLabel}</span>}
      </div>
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} tabular-nums`}
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className={styles.symbol}>{symbol}</span>
        {onMax && (
          <button type="button" className={styles.max} onClick={onMax}>
            Max
          </button>
        )}
      </div>
      {fiatLabel && <span className={`${styles.fiat} tabular-nums`}>{fiatLabel}</span>}
    </div>
  );
}
