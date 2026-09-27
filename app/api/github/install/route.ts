import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGitHubInstallState, githubInstallStateCookie } from "@/lib/github/app";

export const runtime = "nodejs";

const workspaceAdminRoles = ["owner", "admin"];

function redirect(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = process.env.GITHUB_APP_SLUG;
  if (!slug) return redirect(request, "/admin?github=configuration_error");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return redirect(request, "/sign-in?error=github_configuration_required");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect(request, "/sign-in?error=github_authentication_required");

  const requestedWorkspaceId = url.searchParams.get("workspace_id");
  let membershipQuery = supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id);
  if (requestedWorkspaceId) membershipQuery = membershipQuery.eq("workspace_id", requestedWorkspaceId);
  else membershipQuery = membershipQuery.order("created_at", { ascending: true }).limit(1);
  const { data: membership } = await membershipQuery.maybeSingle();
  if (!membership) return redirect(request, "/admin?github=workspace_required");
  if (!workspaceAdminRoles.includes(membership.role)) return redirect(request, "/admin?github=permission_denied");

  const state = createGitHubInstallState();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await supabase.from("github_installation_states").insert({
    state_hash: state.hash,
    user_id: user.id,
    workspace_id: membership.workspace_id,
    expires_at: expiresAt,
  });
  if (error) return redirect(request, "/admin?github=state_error");

  const response = NextResponse.redirect(new URL(`https://github.com/apps/${encodeURIComponent(slug)}/installations/new`));
  response.cookies.set(githubInstallStateCookie, state.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/api/github/callback",
  });
  return response;
}
