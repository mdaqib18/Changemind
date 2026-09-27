import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const slugify = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await request.json() as { name?: string };
  const workspaceName = name?.trim() ?? "";
  const slug = slugify(workspaceName);
  if (workspaceName.length < 2 || workspaceName.length > 100 || !slug) return NextResponse.json({ error: "Choose a workspace name between 2 and 100 characters." }, { status: 400 });
  const { data, error } = await supabase.rpc("create_workspace", { workspace_name: workspaceName, workspace_slug: slug });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That workspace name is already in use. Try a more distinctive name." : error.message }, { status: 400 });
  return NextResponse.json({ workspace: data }, { status: 201 });
}
