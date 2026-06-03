import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * AES-256-GCM token encryption for Plaid access tokens.
 *
 * Requires the env var PLAID_ENCRYPTION_KEY to be a 64-character hex string
 * (32 bytes). Generate one with:  openssl rand -hex 32
 *
 * Storage format (all hex, concatenated):
 *   [12-byte IV = 24 chars][16-byte auth tag = 32 chars][ciphertext]
 */

function getKey(): Buffer {
  const k = process.env.PLAID_ENCRYPTION_KEY;
  if (!k || k.length !== 64) {
    throw new Error(
      "PLAID_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). " +
        "Generate with: openssl rand -hex 32",
    );
  }
  return Buffer.from(k, "hex");
}

export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return iv.toString("hex") + tag.toString("hex") + ciphertext.toString("hex");
}

export function decryptToken(stored: string): string {
  const key = getKey();
  const iv = Buffer.from(stored.slice(0, 24), "hex");
  const tag = Buffer.from(stored.slice(24, 56), "hex");
  const ciphertext = Buffer.from(stored.slice(56), "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}
