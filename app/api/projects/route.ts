import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const permittedRoles = ["owner", "admin"];

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { workspaceId?: string; name?: string; description?: string; slug?: string; visibility?: string; repository?: { name?: string; defaultBranch?: string; isDemo?: boolean } };
  const name = body.name?.trim(); const slug = body.slug?.trim().toLowerCase();
  if (!body.workspaceId || !name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? "")) return NextResponse.json({ error: "A project name and lowercase slug are required." }, { status: 400 });
  const { data: membership } = await supabase.from("workspace_members").select("role").eq("workspace_id", body.workspaceId).eq("user_id", user.id).maybeSingle();
  if (!membership || !permittedRoles.includes(membership.role)) return NextResponse.json({ error: "You do not have permission to create projects in this workspace." }, { status: 403 });
  const { data: project, error } = await supabase.from("projects").insert({ workspace_id: body.workspaceId, name, slug, description: body.description?.trim() || null, visibility: body.visibility === "public" ? "public" : body.visibility === "internal" ? "internal" : "private", created_by: user.id }).select("id, name, slug").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (body.repository?.name) {
    const { error: repositoryError } = await supabase.from("repositories").insert({ project_id: project.id, name: body.repository.name.slice(0, 200), default_branch: body.repository.defaultBranch?.trim().slice(0, 100) || "main", is_demo: Boolean(body.repository.isDemo) });
    if (repositoryError) return NextResponse.json({ error: repositoryError.message }, { status: 400 });
  }
  return NextResponse.json({ project }, { status: 201 });
}
