"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Check, Eye, EyeOff, Loader2, Moon, Sun, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { LetterGlitch } from "@/components/ui/letter-glitch";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { loginSchema } from "@/lib/validation/auth";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A11.998 11.998 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.27a12 12 0 0 0 0 10.76l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0A11.998 11.998 0 0 0 1.27 6.62l4 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="relative flex size-12 items-center justify-center rounded-xl border border-border bg-card font-mono text-sm font-bold shadow-sm animate-in zoom-in-75 spin-in-6 duration-500 ease-out motion-reduce:animate-none">
      <span>&lt;/&gt;</span>
      <span className="absolute -right-1.5 -top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-background" />
    </div>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [form, setForm] = React.useState({ email: "", password: "", rememberMe: false });
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading">("idle");
  const [googleStatus, setGoogleStatus] = React.useState<"idle" | "loading">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Unable to sign in.");
        setStatus("idle");
        return;
      }

      const next = searchParams.get("next") ?? "/dashboard";
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setStatus("idle");
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleStatus("loading");
    try {
      const res = await fetch("/api/auth/google");
      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Google sign-in isn't configured for this workspace yet.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setGoogleStatus("idle");
    }
  }

  const busy = status === "loading" || googleStatus === "loading";

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 z-0 opacity-[0.15]">
        <LetterGlitch centerVignette smooth glitchSpeed={50} />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-[100px] animate-in fade-in zoom-in-90 duration-1000 motion-reduce:animate-none"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1">
        <section className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-border/60 p-10 lg:flex xl:p-14">
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-500 motion-reduce:animate-none">
            <LogoMark />
            <span className="font-mono text-sm font-semibold tracking-tight">
              engineering-workspace
            </span>
          </div>

          <div className="max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100 fill-mode-both motion-reduce:animate-none">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {"// developer workspace"}
            </p>

            <h1 className="text-5xl font-semibold tracking-[-0.04em] xl:text-6xl">
              Build.
              <br />
              Ship.
              <br />
              <span className="text-muted-foreground">Repeat.</span>
            </h1>

            <p className="mt-7 max-w-md text-sm leading-6 text-muted-foreground">
              A unified workspace for team messaging, GitHub repositories, code
              review, CI, and collaboration.
            </p>

            <div className="mt-10 overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-2xl shadow-black/5 backdrop-blur">
              <div className="flex h-9 items-center gap-1.5 border-b border-border/60 px-4">
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                  terminal
                </span>
              </div>

              <div className="space-y-2 p-5 font-mono text-xs">
                <div className="text-muted-foreground">
                  <span className="text-foreground">~/workspace</span>{" "}
                  <span className="text-primary">$</span> git status
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Check className="size-3.5 text-emerald-500" />
                  working tree clean
                </div>

                <div className="text-muted-foreground">
                  <span className="text-foreground">~/workspace</span>{" "}
                  <span className="text-primary">$</span>{" "}
                  <span className="motion-safe:animate-pulse">_</span>
                </div>
              </div>
            </div>
          </div>

          <div className="font-mono text-[11px] text-muted-foreground">
            v1.0.0 · secure workspace
          </div>
        </section>

        <section className="flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[520px] lg:flex-none lg:px-12 xl:w-[560px]">
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 fill-mode-both motion-reduce:animate-none">
            <div className="mb-10 flex justify-center lg:hidden">
              <LogoMark />
            </div>

            <div className="mb-8">
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Welcome back
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">Sign in</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Access your developer workspace.
              </p>
            </div>

            <Card>
              <CardContent>
                <form onSubmit={handleSubmit} noValidate>
                  <FieldGroup>
                    {error && (
                      <Alert variant="destructive">
                        <XCircle className="size-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Field>
                      <Button
                        variant="outline"
                        type="button"
                        disabled={busy}
                        onClick={handleGoogleSignIn}
                      >
                        {googleStatus === "loading" ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <GoogleIcon className="size-4" />
                        )}
                        Continue with Google
                      </Button>
                    </Field>

                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                      Or continue with email
                    </FieldSeparator>

                    <Field>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        disabled={busy}
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </Field>

                    <Field>
                      <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <Link
                          href="/forgot-password"
                          className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          disabled={busy}
                          value={form.password}
                          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </Field>

                    <Field orientation="horizontal">
                      <Checkbox
                        id="rememberMe"
                        checked={form.rememberMe}
                        onCheckedChange={(checked) =>
                          setForm((f) => ({ ...f, rememberMe: checked === true }))
                        }
                      />
                      <FieldLabel htmlFor="rememberMe" className="font-normal text-muted-foreground">
                        Remember me
                      </FieldLabel>
                    </Field>

                    <Field>
                      <Button type="submit" disabled={busy}>
                        {status === "loading" && <Loader2 className="size-4 animate-spin" />}
                        Sign in
                      </Button>
                      <FieldDescription className="text-center">
                        Don&apos;t have an account? <Link href="/register">Sign up</Link>
                      </FieldDescription>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </Card>

            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Sun className="size-3.5 dark:hidden" />
                <Moon className="hidden size-3.5 dark:block" />
                <span>{mounted && resolvedTheme === "dark" ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
