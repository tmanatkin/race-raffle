function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeBase64Url(bytes: Uint8Array): string {
  return toBase64Url(bytes);
}

export function decodeBase64Url(value: string): Uint8Array {
  return fromBase64Url(value);
}

export function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function asBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as BufferSource;
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey("raw", asBufferSource(encodeUtf8(secret)), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, asBufferSource(encodeUtf8(data)));
  return encodeBase64Url(new Uint8Array(signature));
}

export async function hmacVerify(secret: string, data: string, signature: string): Promise<boolean> {
  const key = await importHmacKey(secret);
  try {
    return await crypto.subtle.verify(
      "HMAC",
      key,
      asBufferSource(decodeBase64Url(signature)),
      asBufferSource(encodeUtf8(data))
    );
  } catch {
    return false;
  }
}

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_HASH = "SHA-256";
const PBKDF2_KEY_LENGTH = 32;

// Uses "." rather than "$" as the field delimiter because dotenv's variable
// expansion (used when Next.js loads .env files) treats "$name" as a
// reference and silently strips it from the value.
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2.${PBKDF2_ITERATIONS}.${encodeBase64Url(salt)}.${encodeBase64Url(hash)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(".");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }

  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const salt = decodeBase64Url(parts[2]);
  const expectedHash = decodeBase64Url(parts[3]);
  const actualHash = await pbkdf2(password, salt, iterations);

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < actualHash.length; i += 1) {
    mismatch |= actualHash[i] ^ expectedHash[i];
  }
  return mismatch === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations = PBKDF2_ITERATIONS): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", asBufferSource(encodeUtf8(password)), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: asBufferSource(salt), iterations, hash: PBKDF2_HASH },
    key,
    PBKDF2_KEY_LENGTH * 8
  );
  return new Uint8Array(bits);
}
