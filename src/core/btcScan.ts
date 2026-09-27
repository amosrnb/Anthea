/**
 * Bitcoin gap-limit scan (BIP44/BIP84, gap 20) for imported wallets: walks receive and change addresses until 20
 * consecutive ones have never been used. Pure logic; the "used?" lookup is injected (Esplora in services/).
 */
import type { Network } from './address';
import { btcAddressFromXpub, type AccountPublic, type BtcChain } from './derive';

export const GAP_LIMIT = 20;

export type IsUsed = (address: string) => Promise<boolean>;

/** Index of the first unused address after the last used one (0 when none is used). */
export async function scanChain(xpub: string, network: Network, chain: BtcChain, isUsed: IsUsed, gap = GAP_LIMIT, batch = 5): Promise<number> {
  let next = 0; // first index after the last used address
  let index = 0;
  while (index - next < gap) {
    const indices = Array.from({ length: Math.min(batch, next + gap - index) }, (_, i) => index + i);
    const used = await Promise.all(indices.map((i) => isUsed(btcAddressFromXpub(xpub, network, chain, i))));
    used.forEach((u, i) => {
      if (u) next = indices[i]! + 1;
    });
    index += indices.length;
  }
  return next;
}

/** Scans both chains and returns the accounts with all used addresses plus the next unused one per chain. */
export async function scanBitcoin(accounts: AccountPublic, isUsed: IsUsed, gap = GAP_LIMIT): Promise<AccountPublic> {
  const { xpub } = accounts.btc;
  const [receiveNext, changeNext] = [
    await scanChain(xpub, accounts.network, 'receive', isUsed, gap),
    await scanChain(xpub, accounts.network, 'change', isUsed, gap),
  ];
  const list = (chain: BtcChain, next: number) => Array.from({ length: next + 1 }, (_, i) => btcAddressFromXpub(xpub, accounts.network, chain, i));
  return { ...accounts, btc: { xpub, receive: list('receive', receiveNext), change: list('change', changeNext) } };
}
