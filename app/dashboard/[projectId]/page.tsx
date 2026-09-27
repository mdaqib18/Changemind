import { redirect } from "next/navigation";
import Overview from "@/app/page";
import { getProject } from "@/lib/data/projects";

export default async function ProjectDashboard({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  // Keep the pre-existing offline product demo usable when Supabase is not configured.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return <Overview />;
  const project = await getProject(projectId);
  if (!project) redirect("/admin?project=not-found");
  return <Overview />;
}
