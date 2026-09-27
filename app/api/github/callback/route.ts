import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGitHubInstallation, githubInstallStateCookie, hashGitHubInstallState } from "@/lib/github/app";

export const runtime = "nodejs";

function redirect(request: Request, status: string) {
  const response = NextResponse.redirect(new URL(`/admin?github=${status}`, request.url));
  response.cookies.set(githubInstallStateCookie, "", { httpOnly: true, maxAge: 0, path: "/api/github/callback" });
  return response;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (url.searchParams.get("error")) return redirect(request, "github_error");

  const installationId = url.searchParams.get("installation_id");
  if (!installationId || !/^[1-9]\d{0,18}$/.test(installationId)) return redirect(request, "installation_missing");

  const state = request.cookies.get(githubInstallStateCookie)?.value;
  if (!state) return redirect(request, "state_invalid");
  const returnedState = url.searchParams.get("state");
  if (returnedState && returnedState !== state) return redirect(request, "state_invalid");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return redirect(request, "configuration_error");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in?error=github_authentication_required", request.url));

  const { data: workspaceId, error: stateError } = await supabase.rpc("consume_github_installation_state", { provided_state_hash: hashGitHubInstallState(state) });
  if (stateError || !workspaceId) return redirect(request, "state_invalid");

  let installation;
  try {
    installation = await getGitHubInstallation(installationId);
  } catch {
    return redirect(request, "installation_verification_failed");
  }

  const { data: existing } = await supabase.from("github_installations").select("id").eq("installation_id", installationId).maybeSingle();
  const values = {
    workspace_id: workspaceId,
    installation_id: installationId,
    account_id: installation.account?.id?.toString() ?? null,
    account_login: installation.account?.login ?? null,
    account_type: installation.account?.type ?? null,
  };
  const { error } = existing
    ? await supabase.from("github_installations").update(values).eq("id", existing.id)
    : await supabase.from("github_installations").insert(values);
  if (error) return redirect(request, "persistence_error");

  return redirect(request, "connected");
}
