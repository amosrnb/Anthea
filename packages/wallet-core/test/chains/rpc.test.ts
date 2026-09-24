/**
 * Network/RPC behaviour of the chain adapters against a stubbed JSON-RPC
 * endpoint: which endpoint each network hits, fee estimates, signed sends
 * and transaction status. No real network access.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

type RpcCall = { url: string; method: string; params: unknown[] };
type Handler = (call: RpcCall) => unknown;

// @solana/web3.js captures `globalThis.fetch` when it loads, so install a
// delegating stub before anything imports it.
const rpc = vi.hoisted(() => {
  const state = { handler: null as Handler | null, calls: [] as RpcCall[] };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const body = JSON.parse(String(init?.body));
    const reply = (req: { id: number; method: string; params?: unknown[] }) => {
      const call = { url, method: req.method, params: req.params ?? [] };
      state.calls.push(call);
      if (!state.handler) throw new Error(`Unexpected RPC call ${req.method}`);
      return { jsonrpc: "2.0", id: req.id, result: state.handler(call) };
    };
    const payload = Array.isArray(body) ? body.map(reply) : reply(body);
    return new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  return state;
});

import { parseTransaction, type Hex } from "viem";
import { deriveEthereumAccount, ETHEREUM_SEPOLIA_DEFAULT_RPC, EthereumAccount } from "../../src/chains/ethereum.js";
import { deriveSolanaKeypair, SOLANA_DEVNET_RPC, SolanaAccount } from "../../src/chains/solana.js";
import { explorerTxUrl } from "../../src/explorer.js";

const MNEMONIC = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const TESTNET = { network: "testnet" } as const;

afterEach(() => {
  rpc.handler = null;
  rpc.calls = [];
});

function handle(results: Record<string, unknown | ((call: RpcCall) => unknown)>) {
  rpc.handler = (call) => {
    if (!(call.method in results)) throw new Error(`Unexpected RPC call ${call.method}`);
    const r = results[call.method];
    return typeof r === "function" ? (r as (c: RpcCall) => unknown)(call) : r;
  };
}

describe("ethereum over RPC", () => {
  const account = new EthereumAccount(deriveEthereumAccount(MNEMONIC, 0));
  const to = "0x000000000000000000000000000000000000dEaD";
  const block = {
    number: "0x10",
    hash: `0x${"11".repeat(32)}`,
    baseFeePerGas: "0x3b9aca00", // 1 gwei
    timestamp: "0x1",
    transactions: [],
  };

  it("reads the balance from Sepolia's public endpoint on testnet", async () => {
    handle({ eth_getBalance: "0xde0b6b3a7640000" });
    expect(await account.getNativeBalance(TESTNET)).toBe("1");
    expect(new URL(rpc.calls[0].url).href).toBe(new URL(ETHEREUM_SEPOLIA_DEFAULT_RPC).href);
  });

  it("uses a custom RPC URL when given", async () => {
    handle({ eth_getBalance: "0x0" });
    await account.getNativeBalance({ network: "testnet", rpcUrl: "https://rpc.example/sepolia" });
    expect(rpc.calls[0].url).toBe("https://rpc.example/sepolia");
  });

  it("estimates the fee as gas × max fee per gas", async () => {
    handle({ eth_getBlockByNumber: block, eth_maxPriorityFeePerGas: "0x3b9aca00", eth_estimateGas: "0x5208" });
    // viem: maxFeePerGas = 1.2 × base fee + priority fee = 2.2 gwei; × 21,000 gas.
    expect(await account.estimateNativeFee(to, "0.01", TESTNET)).toBe("0.0000462");
  });

  it("signs a Sepolia transaction locally and broadcasts it", async () => {
    let raw: Hex | undefined;
    handle({
      eth_chainId: "0xaa36a7",
      eth_getTransactionCount: "0x0",
      eth_getBlockByNumber: block,
      eth_maxPriorityFeePerGas: "0x3b9aca00",
      eth_estimateGas: "0x5208",
      eth_sendRawTransaction: (call: RpcCall) => {
        raw = call.params[0] as Hex;
        return `0x${"ab".repeat(32)}`;
      },
    });
    expect(await account.sendNative(to, "0.5", TESTNET)).toBe(`0x${"ab".repeat(32)}`);
    const tx = parseTransaction(raw!);
    expect(tx.chainId).toBe(11155111);
    expect(tx.to).toBe(to.toLowerCase());
    expect(tx.value).toBe(500000000000000000n);
    // Nothing secret goes over the wire: only the signed transaction.
    expect(JSON.stringify(rpc.calls)).not.toContain("abandon");
  });

  it("rejects a bad address or amount before any RPC call", async () => {
    await expect(account.sendNative("0x123", "1", TESTNET)).rejects.toThrow(/Invalid Ethereum address/);
    await expect(account.estimateNativeFee(to, "0", TESTNET)).rejects.toThrow(/greater than zero/);
    expect(rpc.calls).toHaveLength(0);
  });

  it("reports pending, confirmed and failed transactions", async () => {
    const hash = `0x${"cd".repeat(32)}`;
    const receipt = (status: string) => ({
      transactionHash: hash,
      blockHash: block.hash,
      blockNumber: "0x10",
      status,
      logs: [],
      logsBloom: `0x${"00".repeat(256)}`,
      gasUsed: "0x5208",
      cumulativeGasUsed: "0x5208",
      effectiveGasPrice: "0x1",
      transactionIndex: "0x0",
      type: "0x2",
      from: account.address,
      to,
      contractAddress: null,
    });
    handle({ eth_getTransactionReceipt: null });
    expect(await account.getTransactionStatus(hash, TESTNET)).toBe("pending");
    handle({ eth_getTransactionReceipt: receipt("0x1") });
    expect(await account.getTransactionStatus(hash, TESTNET)).toBe("confirmed");
    handle({ eth_getTransactionReceipt: receipt("0x0") });
    expect(await account.getTransactionStatus(hash, TESTNET)).toBe("failed");
  });
});

describe("solana over RPC", () => {
  const account = new SolanaAccount(deriveSolanaKeypair(MNEMONIC, 0));
  const to = "Hh8QwFUA6MtVu1qAoq12ucvFHNwCcVTV7hpWjeY1Hztb";
  const ctx = { context: { slot: 1 } };
  const blockhash = { ...ctx, value: { blockhash: "EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3hq1k", lastValidBlockHeight: 100 } };

  it("reads the balance from Devnet on testnet", async () => {
    handle({ getBalance: { ...ctx, value: 1_500_000_000 } });
    expect(await account.getNativeBalance(TESTNET)).toBe("1.5");
    expect(new URL(rpc.calls[0].url).href).toBe(new URL(SOLANA_DEVNET_RPC).href);
  });

  it("quotes the fee from the RPC", async () => {
    handle({ getLatestBlockhash: blockhash, getFeeForMessage: { ...ctx, value: 5000 } });
    expect(await account.estimateNativeFee(to, "0.1", TESTNET)).toBe("0.000005");
  });

  it("signs a transfer locally and submits it", async () => {
    let wire: string | undefined;
    handle({
      getBalance: { ...ctx, value: 1 },
      getMinimumBalanceForRentExemption: 890880,
      getLatestBlockhash: blockhash,
      sendTransaction: (call: RpcCall) => {
        wire = call.params[0] as string;
        return "5ig1ncgBaSx3yL6xAPo6J5UW1d3SRrPYw3ykbHKo8bTs3eQZNJKZ8shgF6eyDVBDJZnXuxBSQbc4Qk5GZ48gYHfN";
      },
    });
    const signature = await account.sendNative(to, "0.25", TESTNET);
    expect(signature).toMatch(/^5ig1/);

    const web3 = await import("@solana/web3.js");
    const tx = web3.Transaction.from(Buffer.from(wire!, "base64"));
    expect(tx.verifySignatures()).toBe(true);
    expect(tx.feePayer?.toBase58()).toBe(account.address);
    const transfer = web3.SystemInstruction.decodeTransfer(tx.instructions[0]);
    expect(transfer.toPubkey.toBase58()).toBe(to);
    expect(transfer.lamports).toBe(250_000_000n);
    expect(rpc.calls.every((c) => new URL(c.url).href === new URL(SOLANA_DEVNET_RPC).href)).toBe(true);
  });

  it("refuses a first transfer to an empty address below the rent-exempt minimum", async () => {
    handle({ getBalance: { ...ctx, value: 0 }, getMinimumBalanceForRentExemption: 890880 });
    await expect(account.sendNative(to, "0.0001", TESTNET)).rejects.toThrow(/at least 0.00089088 SOL/);
    expect(rpc.calls.some((c) => c.method === "sendTransaction")).toBe(false);
  });

  it("reports pending, confirmed and failed signatures", async () => {
    const status = (value: unknown) => ({ ...ctx, value: [value] });
    handle({ getSignatureStatuses: status(null) });
    expect(await account.getTransactionStatus("sig", TESTNET)).toBe("pending");
    handle({ getSignatureStatuses: status({ slot: 1, confirmations: 0, err: null, confirmationStatus: "processed" }) });
    expect(await account.getTransactionStatus("sig", TESTNET)).toBe("pending");
    handle({ getSignatureStatuses: status({ slot: 1, confirmations: null, err: null, confirmationStatus: "finalized" }) });
    expect(await account.getTransactionStatus("sig", TESTNET)).toBe("confirmed");
    handle({ getSignatureStatuses: status({ slot: 1, confirmations: 1, err: { InstructionError: [0, "Custom"] }, confirmationStatus: "confirmed" }) });
    expect(await account.getTransactionStatus("sig", TESTNET)).toBe("failed");
  });

  it("requests a Devnet airdrop, and only on testnet", async () => {
    handle({ requestAirdrop: "airdropSig" });
    expect(await account.requestTestnetAirdrop("1", TESTNET)).toBe("airdropSig");
    expect(rpc.calls[0].params[1]).toBe(1_000_000_000);
    await expect(account.requestTestnetAirdrop("1")).rejects.toThrow(/only available on the test network/);
    await expect(account.requestTestnetAirdrop("5", TESTNET)).rejects.toThrow(/at most 2 SOL/);
  });
});

describe("explorer links", () => {
  it("points at the right explorer and network", () => {
    expect(explorerTxUrl("ethereum", "0xabc")).toBe("https://etherscan.io/tx/0xabc");
    expect(explorerTxUrl("ethereum", "0xabc", "testnet")).toBe("https://sepolia.etherscan.io/tx/0xabc");
    expect(explorerTxUrl("solana", "sig")).toBe("https://explorer.solana.com/tx/sig");
    expect(explorerTxUrl("solana", "sig", "testnet")).toBe("https://explorer.solana.com/tx/sig?cluster=devnet");
  });
});
