import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyPassword } from "@/lib/auth/crypto";
import {
  createSessionCookieValue,
  Role,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { withErrorHandling } from "@/lib/api/route-handler";

function getPasswordHashForRole(role: Role): string | undefined {
  if (role === "admin") {
    return process.env.ADMIN_PASSWORD_HASH;
  }
  if (role === "volunteer") {
    return process.env.VOLUNTEER_PASSWORD_HASH;
  }
  return undefined;
}

export const POST = withErrorHandling(async (request: Request) => {
  const body = (await request.json()) as { role?: string; password?: string };
  const role = body.role;
  const password = body.password;

  if ((role !== "admin" && role !== "volunteer") || typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "A role and password are required." }, { status: 400 });
  }

  const passwordHash = getPasswordHashForRole(role);
  if (!passwordHash) {
    console.error(`Missing password hash env var for role "${role}".`);
    return NextResponse.json({ error: "Login is currently unavailable. Please try again later." }, { status: 500 });
  }

  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const cookieValue = await createSessionCookieValue(role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ role });
});
