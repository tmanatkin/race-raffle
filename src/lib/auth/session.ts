import { decodeBase64Url, decodeUtf8, encodeBase64Url, encodeUtf8, hmacSign, hmacVerify } from "./crypto";

export const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 12; // 12 hours

export type Role = "admin" | "volunteer";

export type SessionPayload = {
  role: Role;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return secret;
}

export async function createSessionCookieValue(role: Role): Promise<string> {
  const payload: SessionPayload = {
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };

  const encodedPayload = encodeBase64Url(encodeUtf8(JSON.stringify(payload)));
  const signature = await hmacSign(getSessionSecret(), encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionCookieValue(value: string | undefined): Promise<SessionPayload | null> {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const isValid = await hmacVerify(getSessionSecret(), encodedPayload, signature);
  if (!isValid) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(decodeUtf8(decodeBase64Url(encodedPayload)));
  } catch {
    return null;
  }

  if (payload.role !== "admin" && payload.role !== "volunteer") {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export const SESSION_COOKIE_MAX_AGE_SECONDS = SESSION_DURATION_SECONDS;
