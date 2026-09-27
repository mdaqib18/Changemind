import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProjectRecord = { id: string; workspace_id: string; name: string; slug: string; description: string | null; visibility: "private" | "internal" | "public"; created_at: string };

/** RLS is the authorization boundary: this returns null for missing or inaccessible projects. */
export async function getProject(projectId: string): Promise<ProjectRecord | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data } = await supabase.from("projects").select("id, workspace_id, name, slug, description, visibility, created_at").eq("id", projectId).maybeSingle();
  return data as ProjectRecord | null;
}
