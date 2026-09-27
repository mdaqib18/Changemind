import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getProjectRepositories(projectId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data } = await supabase.from("repositories").select("id, name, github_repo_id, github_url, default_branch, is_demo").eq("project_id", projectId);
  return data ?? [];
}
