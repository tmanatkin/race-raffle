"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowBigUpDash, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Role = "admin" | "volunteer";

function isRole(value: string | null): value is Role {
  return value === "admin" || value === "volunteer";
}

export function LoginPageContent({ currentRole }: { currentRole: Role | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const next = searchParams.get("next");
  const [role, setRole] = useState<Role>(isRole(roleParam) ? roleParam : (currentRole ?? "admin"));
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [error, setError] = useState(
    next ? `Log in${isRole(roleParam) ? " as " + roleParam : ""} before continuing.` : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const globalCapsLockRef = useRef(false);
  const isPasswordFocusedRef = useRef(false);

  useEffect(() => {
    function handleGlobalKeyEvent(event: globalThis.KeyboardEvent) {
      globalCapsLockRef.current = event.getModifierState("CapsLock");
      if (isPasswordFocusedRef.current) {
        setIsCapsLockOn(globalCapsLockRef.current);
      }
    }

    document.addEventListener("keydown", handleGlobalKeyEvent, true);
    document.addEventListener("keyup", handleGlobalKeyEvent, true);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyEvent, true);
      document.removeEventListener("keyup", handleGlobalKeyEvent, true);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to log in.");
      }

      const fallbackPath = role === "admin" ? "/admin" : "/volunteer";
      router.replace(next && next.startsWith(`/${role}`) ? next : fallbackPath);
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to log in.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>

        <Tabs
          onValueChange={(value) => {
            if (isRole(value)) {
              setRole(value);
              setError("");
            }
          }}
          value={role}
        >
          <TabsList>
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="volunteer">Volunteer</TabsTrigger>
          </TabsList>
          <TabsContent value={role}>
            <form className="space-y-4 pt-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    autoFocus
                    className="pr-16"
                    disabled={isSubmitting}
                    id="login-password"
                    name="password"
                    onBlur={() => {
                      isPasswordFocusedRef.current = false;
                      setIsCapsLockOn(false);
                    }}
                    onChange={(event) => setPassword(event.target.value)}
                    onFocus={() => {
                      isPasswordFocusedRef.current = true;
                      setIsCapsLockOn(globalCapsLockRef.current);
                    }}
                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) =>
                      setIsCapsLockOn(event.getModifierState("CapsLock"))
                    }
                    onKeyUp={(event: KeyboardEvent<HTMLInputElement>) =>
                      setIsCapsLockOn(event.getModifierState("CapsLock"))
                    }
                    onMouseDown={(event) => {
                      globalCapsLockRef.current = event.getModifierState("CapsLock");
                      isPasswordFocusedRef.current = true;
                      setIsCapsLockOn(globalCapsLockRef.current);
                    }}
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
                    {isCapsLockOn ? (
                      <ArrowBigUpDash aria-label="Caps Lock is on" className="size-4 text-amber-500" />
                    ) : null}
                    <button
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((current) => !current)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button disabled={isSubmitting || password.length === 0} type="submit">
                {isSubmitting ? "Logging in..." : "Log in"}
              </Button>
              {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
            </form>
          </TabsContent>
        </Tabs>

        {currentRole ? (
          <p className="text-center text-sm text-muted-foreground">
            Already logged in.{" "}
            <Link className="text-foreground underline underline-offset-4" href={`/${currentRole}`}>
              Continue as {currentRole}
            </Link>
          </p>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Looking for the prize raffle?{" "}
            <Link className="text-foreground underline underline-offset-4" href="/">
              Check your bib number
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
