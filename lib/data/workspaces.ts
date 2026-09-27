import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUserWorkspaces() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from("workspace_members").select("role, workspaces ( id, name, slug )");
  return data ?? [];
}
