import crypto from "node:crypto";

/**
 * Base32 character set for RFC 4648
 */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Decodes a base32 encoded string into a Buffer.
 */
function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[=\s]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]!);
    if (idx === -1) {
      continue; // Skip invalid characters
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates an RFC 6238 compliant 6-digit TOTP code for a given timestamp and secret.
 */
export function generateTotpCode(secret: string, timestamp: number = Date.now(), step: number = 30): string {
  const counter = Math.floor(timestamp / 1000 / step);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const keyBuffer = base32Decode(secret);
  const hmac = crypto.createHmac("sha1", keyBuffer.length > 0 ? keyBuffer : Buffer.from(secret, "utf-8"));
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1]! & 0xf;
  const codeInt =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  const code = (codeInt % 1000000).toString().padStart(6, "0");
  return code;
}

/**
 * Verifies a 6-digit TOTP code allowing ±1 step (30s) drift.
 */
export function verifyTotpCode(
  secret: string,
  token: string,
  timestamp: number = Date.now(),
  window: number = 1
): boolean {
  if (!token || token.trim().length !== 6) {
    return false;
  }

  const cleanToken = token.trim();
  const step = 30;

  for (let i = -window; i <= window; i++) {
    const checkTime = timestamp + i * step * 1000;
    const expected = generateTotpCode(secret, checkTime, step);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
      return true;
    }
  }

  return false;
}
