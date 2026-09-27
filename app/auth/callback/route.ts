import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function signInError(url: URL, reason: string) {
  return NextResponse.redirect(new URL(`/sign-in?error=${reason}`, url.origin));
}

function safeDestination(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return signInError(url, url.searchParams.get("error") ? "oauth_callback_failed" : "missing_callback_code");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return signInError(url, "configuration");

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  if (sessionError) return signInError(url, "oauth_callback_failed");

  const { error: profileError } = await supabase.rpc("ensure_profile");
  if (profileError) return signInError(url, "profile_setup_failed");

  return NextResponse.redirect(new URL(safeDestination(url.searchParams.get("next")), url.origin));
}
