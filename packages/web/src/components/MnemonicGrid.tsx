import styles from "./MnemonicGrid.module.css";

export function MnemonicGrid({ mnemonic, revealed }: { mnemonic: string; revealed: boolean }) {
  const words = mnemonic.trim().split(/\s+/);
  return (
    <div className={`${styles.grid} ${revealed ? "" : styles.blurred}`}>
      {words.map((word, i) => (
        <div className={styles.word} key={i}>
          <span className={styles.index}>{i + 1}</span>
          <span>{word}</span>
        </div>
      ))}
    </div>
  );
}
