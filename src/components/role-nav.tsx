"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/auth/session";

export function RoleNav({ role }: { role: Role }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm shadow-sm lg:fixed lg:top-4 lg:right-4 lg:z-50 lg:mx-0 lg:mt-0">
      {role === "admin" ? (
        <nav className="flex items-center gap-1">
          <Link
            href="/admin"
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              pathname?.startsWith("/admin")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Admin
          </Link>
          <Link
            href="/volunteer"
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              pathname?.startsWith("/volunteer")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Volunteer
          </Link>
        </nav>
      ) : null}
      <AlertDialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
        <Button variant="ghost" size="sm" onClick={() => setIsConfirmOpen(true)} disabled={isLoggingOut}>
          <LogOut />
          Log out
        </Button>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsConfirmOpen(false);
                handleLogout();
              }}
            >
              Log out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
