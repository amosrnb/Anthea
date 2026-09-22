const KEY_PREFIX = "anthea:backedUp:";

/** Whether the user has completed the seed-phrase backup flow for this wallet. */
export function isBackedUp(walletId: string): boolean {
  return localStorage.getItem(KEY_PREFIX + walletId) === "1";
}

export function markBackedUp(walletId: string): void {
  localStorage.setItem(KEY_PREFIX + walletId, "1");
}
