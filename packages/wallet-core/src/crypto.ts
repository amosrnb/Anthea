/**
 * Password-based encryption for the local keystore.
 *
 * Uses only the platform Web Crypto API (available in browsers and Node's
 * `globalThis.crypto`) — no bespoke crypto primitives. PBKDF2-SHA256 derives
 * a key from the user's password; AES-256-GCM encrypts the secret with that
 * key. Salt and IV are generated fresh per encryption and stored alongside
 * the ciphertext (they are not secret).
 */

export const PBKDF2_ITERATIONS = 600_000; // OWASP 2023 minimum for PBKDF2-SHA256
const SALT_BYTES = 16;
const IV_BYTES = 12; // recommended nonce size for AES-GCM
const AES_KEY_LENGTH = 256;

export interface EncryptedPayload {
  /** Base64 ciphertext (includes GCM auth tag). */
  ciphertext: string;
  /** Base64 salt used for PBKDF2 key derivation. */
  salt: string;
  /** Base64 initialization vector used for AES-GCM. */
  iv: string;
  /** PBKDF2 iteration count used, so it can be changed later without breaking old vaults. */
  iterations: number;
}

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("Web Crypto API (crypto.subtle) is not available in this environment");
  }
  return subtle;
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveAesKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const passwordKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    passwordKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt `plaintext` with a key derived from `password`. Fresh salt/IV each call. */
export async function encryptWithPassword(
  plaintext: string,
  password: string,
  iterations: number = PBKDF2_ITERATIONS,
): Promise<EncryptedPayload> {
  const subtle = getSubtle();
  const salt = getRandomBytes(SALT_BYTES);
  const iv = getRandomBytes(IV_BYTES);
  const key = await deriveAesKey(password, salt, iterations);
  const ciphertextBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext),
  );
  return {
    ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    iterations,
  };
}

/**
 * Decrypt a payload produced by `encryptWithPassword`.
 * Throws if the password is wrong or the payload has been tampered with
 * (AES-GCM authentication fails closed).
 */
export async function decryptWithPassword(
  payload: EncryptedPayload,
  password: string,
): Promise<string> {
  const subtle = getSubtle();
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const key = await deriveAesKey(password, salt, payload.iterations);
  let plaintextBuffer: ArrayBuffer;
  try {
    plaintextBuffer = await subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      base64ToBytes(payload.ciphertext) as BufferSource,
    );
  } catch {
    throw new Error("Incorrect password or corrupted keystore");
  }
  return new TextDecoder().decode(plaintextBuffer);
}

/** Best-effort in-memory wipe. JS strings are immutable, so this clears typed-array copies only. */
export function wipeBytes(bytes: Uint8Array): void {
  bytes.fill(0);
}
