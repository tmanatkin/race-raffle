// Generates a password hash for ADMIN_PASSWORD_HASH / VOLUNTEER_PASSWORD_HASH.
// Usage: node scripts/hash-password.mjs <password>
const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const ITERATIONS = 210_000;
const KEY_LENGTH_BITS = 32 * 8;

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, KEY_LENGTH_BITS);

console.log(`pbkdf2.${ITERATIONS}.${toBase64Url(salt)}.${toBase64Url(new Uint8Array(bits))}`);
