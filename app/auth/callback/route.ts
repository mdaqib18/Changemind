import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const destination = next?.startsWith("/") ? next : "/admin";
  if (!code) return NextResponse.redirect(new URL("/sign-in?error=missing_callback_code", url.origin));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/sign-in?error=configuration", url.origin));
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/sign-in?error=oauth_callback_failed", url.origin));
  return NextResponse.redirect(new URL(destination, url.origin));
}
