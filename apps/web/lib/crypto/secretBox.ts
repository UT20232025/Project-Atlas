import crypto from "crypto";

// Symmetric encryption for exchange API secrets at rest. The key comes from
// EXCHANGE_ENCRYPTION_KEY (32 bytes, hex or base64) and never leaves the
// server. If it isn't set, the exchange feature stays disabled rather than
// storing secrets in the clear.

function getKey(): Buffer | null {
  const raw = process.env.EXCHANGE_ENCRYPTION_KEY;
  if (!raw) {
    return null;
  }

  let key: Buffer;
  try {
    key = /^[0-9a-fA-F]{64}$/.test(raw)
      ? Buffer.from(raw, "hex")
      : Buffer.from(raw, "base64");
  } catch {
    return null;
  }

  return key.length === 32 ? key : null;
}

export function isSecretBoxConfigured(): boolean {
  return getKey() !== null;
}

/** Encrypts a secret → "iv.authTag.ciphertext" (all base64). */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  if (!key) {
    throw new Error("EXCHANGE_ENCRYPTION_KEY is not configured.");
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

/** Decrypts a stored "iv.authTag.ciphertext" back to the secret. */
export function decryptSecret(stored: string): string {
  const key = getKey();
  if (!key) {
    throw new Error("EXCHANGE_ENCRYPTION_KEY is not configured.");
  }

  const [ivB64, tagB64, dataB64] = stored.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted secret.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
