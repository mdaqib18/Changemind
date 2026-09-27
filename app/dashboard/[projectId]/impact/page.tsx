import { redirect } from "next/navigation";
import ImpactPage from "@/app/impact/page";
import { getProject } from "@/lib/data/projects";
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; if (process.env.NEXT_PUBLIC_SUPABASE_URL && !(await getProject(projectId))) redirect("/admin?project=not-found"); return <ImpactPage />; }
