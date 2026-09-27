"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GitBranch, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";

function callbackMessage(error: string | null) {
  if (!error) return "";
  if (error === "configuration") {
    return "Supabase public configuration is missing. Add the public URL and publishable key, then restart the development server.";
  }
  if (error === "missing_callback_code" || error === "oauth_callback_failed" || error === "profile_setup_failed") {
    return "GitHub sign-in failed. Please try again.";
  }
  return "Authentication could not be completed. Please try again.";
}

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";
  const displayMessage = message || callbackMessage(params.get("error"));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage("Enter a valid email address.");
    if (password.length < 8) return setMessage("Your password must contain at least 8 characters.");

    const client = createSupabaseBrowserClient();
    if (!client) {
      return setMessage("Supabase is not configured. Add the public URL and publishable key to enable authentication.");
    }

    setPending(true);
    const result = isSignUp
      ? await client.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
      : await client.auth.signInWithPassword({ email, password });
    setPending(false);

    if (result.error) return setMessage(result.error.message);
    if (isSignUp && !result.data.session) return setMessage("Check your email to confirm your account, then sign in.");
    window.location.assign(params.get("next")?.startsWith("/") ? params.get("next")! : "/admin");
  }

  async function github() {
    setMessage("");
    const client = createSupabaseBrowserClient();
    if (!client) {
      return setMessage("Supabase is not configured. Add the public URL and publishable key to enable GitHub sign-in.");
    }

    setPending(true);
    const next = params.get("next");
    const redirectTo = `${window.location.origin}/auth/callback${next?.startsWith("/") ? `?next=${encodeURIComponent(next)}` : ""}`;
    const { error } = await client.auth.signInWithOAuth({ provider: "github", options: { redirectTo } });

    if (error) {
      setPending(false);
      setMessage("GitHub sign-in failed. Please try again.");
    }
  }

  return <main className="sc-grid-bg flex min-h-dvh items-center justify-center p-4"><section className="sc-rise w-full max-w-[390px] rounded-xl border border-white/10 bg-[#121214] p-6 shadow-2xl shadow-black/30"><div className="mb-7"><Link href="/" className="mb-6 flex items-center gap-2 text-sm font-semibold"><span className="flex size-7 items-center justify-center rounded-md bg-white text-xs font-black text-black">C</span>ChangeMind</Link><p className="text-[11px] font-semibold tracking-[0.14em] text-violet-300 uppercase">Understand the impact of every code change</p><h1 className="mt-2 text-xl font-semibold tracking-tight">{isSignUp ? "Create your workspace" : "Welcome back"}</h1><p className="mt-1 text-sm text-muted-foreground">{isSignUp ? "Start coordinating changes across every repository." : "Sign in to your ChangeMind Workspace."}</p></div><form onSubmit={submit} className="space-y-3"><label className="block text-xs font-medium">Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-violet-400/60" placeholder="you@company.com" /></label><label className="block text-xs font-medium">Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={isSignUp ? "new-password" : "current-password"} className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm outline-none focus:border-violet-400/60" placeholder="••••••••" /></label>{displayMessage && <p role="alert" className="rounded-md border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-2 text-xs text-amber-200">{displayMessage}</p>}<Button className="w-full" disabled={pending}>{pending && <LoaderCircle className="size-3.5 animate-spin" />}{isSignUp ? "Create account" : "Sign in"}</Button></form><div className="my-4 flex items-center gap-3 text-[10px] text-muted-foreground before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">OR</div><Button type="button" variant="outline" className="w-full" onClick={github} disabled={pending}><GitBranch className="size-3.5" />{pending ? "Connecting to GitHub…" : "Continue to ChangeMind with GitHub"}</Button>{!hasSupabaseConfig && <p className="mt-2 text-center text-[10px] text-muted-foreground">Supabase public configuration is required for authentication.</p>}<p className="mt-5 text-center text-xs text-muted-foreground">{isSignUp ? "Already have an account?" : "New to ChangeMind?"} <Link className="text-violet-300 hover:text-violet-200" href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link></p></section></main>;
}
