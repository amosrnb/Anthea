export function truncateAddress(address: string, lead = 6, trail = 4): string {
  if (address.length <= lead + trail + 1) return address;
  return `${address.slice(0, lead)}…${address.slice(-trail)}`;
}

export function formatBalance(balance: string, maxDecimals = 6): string {
  const [whole = "0", fraction = ""] = balance.split(".");
  if (!fraction) return whole;
  const trimmed = fraction.slice(0, maxDecimals).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}
