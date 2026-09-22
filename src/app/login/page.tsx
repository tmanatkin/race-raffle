import { Suspense } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";
import { LoginPageContent } from "./login-page-content";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <Suspense>
      <LoginPageContent currentRole={session?.role ?? null} />
    </Suspense>
  );
}
