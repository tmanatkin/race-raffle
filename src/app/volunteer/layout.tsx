import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/auth/session";
import { RoleNav } from "@/components/role-nav";

export default async function VolunteerLayout({ children }: LayoutProps<"/volunteer">) {
  const cookieStore = await cookies();
  const session = await verifySessionCookieValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <div className="flex min-h-dvh flex-col">
      {session ? <RoleNav role={session.role} /> : null}
      {children}
    </div>
  );
}
