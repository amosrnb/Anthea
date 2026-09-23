import { describe, expect, it } from "vitest";
import { decryptWithPassword, encryptWithPassword } from "../src/crypto.js";

describe("crypto", () => {
  it("round-trips plaintext through encrypt/decrypt", async () => {
    const payload = await encryptWithPassword("super secret mnemonic", "correct horse battery staple");
    const decrypted = await decryptWithPassword(payload, "correct horse battery staple");
    expect(decrypted).toBe("super secret mnemonic");
  });

  it("produces a fresh salt and iv on every call (no nonce reuse)", async () => {
    const a = await encryptWithPassword("same plaintext", "password123");
    const b = await encryptWithPassword("same plaintext", "password123");
    expect(a.salt).not.toBe(b.salt);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it("rejects decryption with the wrong password", async () => {
    const payload = await encryptWithPassword("secret", "right-password");
    await expect(decryptWithPassword(payload, "wrong-password")).rejects.toThrow(
      /Incorrect password/,
    );
  });

  it("rejects a tampered ciphertext (GCM auth tag fails closed)", async () => {
    const payload = await encryptWithPassword("secret", "password123");
    const tampered = { ...payload, ciphertext: payload.ciphertext.slice(0, -4) + "abcd" };
    await expect(decryptWithPassword(tampered, "password123")).rejects.toThrow();
  });

  it("does not encode the password or plaintext into the stored payload fields", async () => {
    const payload = await encryptWithPassword("my mnemonic phrase", "hunter2");
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("my mnemonic phrase");
  });
});
