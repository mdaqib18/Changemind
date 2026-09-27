"use client";

import Link from "next/link";
import { FolderGit2, LayoutDashboard, Users } from "lucide-react";
import { ProjectOnboarding } from "@/components/admin/project-onboarding";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { WorkspaceOnboarding } from "@/components/admin/workspace-onboarding";

export default function AdminPage() {
  const { activeWorkspace, loading } = useAuth();
  if (loading) return <div className="text-sm text-muted-foreground">Loading workspace administration…</div>;
  const projects = activeWorkspace?.projects ?? [];
  if (!activeWorkspace) return <WorkspaceOnboarding />;
  return <div className="space-y-5"><header className="sc-page-header"><div><p className="text-[10px] font-semibold tracking-[0.14em] text-violet-300 uppercase">Workspace administration</p><h1>{activeWorkspace.name}</h1><p>Projects, repository connections, and access controls.</p></div><Badge variant="ai" className="capitalize">{activeWorkspace.role}</Badge></header><div className="grid gap-3 sm:grid-cols-3">{[[LayoutDashboard, "Projects", String(projects.length)], [FolderGit2, "Repositories", String(projects.filter((project) => project.repository).length)], [Users, "Your access", activeWorkspace.role]].map(([Icon, label, value]) => { const ItemIcon = Icon as typeof LayoutDashboard; return <section className="sc-panel p-3.5" key={label as string}><ItemIcon className="size-3.5 text-muted-foreground" /><p className="mt-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{label as string}</p><p className="mt-1 text-lg font-semibold capitalize">{value as string}</p></section>; })}</div><div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><section><div className="mb-2 flex items-center"><SectionLabel>Current projects</SectionLabel></div><div className="sc-panel overflow-hidden">{projects.length ? projects.map((project) => <Link href={`/dashboard/${project.id}`} key={project.id} className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3 last:border-0 hover:bg-white/[0.025]"><FolderGit2 className="size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-xs font-medium">{project.name}</p><p className="sc-mono truncate text-[10px] text-muted-foreground">{project.repository?.name ?? "No repository connected"}</p></div><Badge variant="muted">{project.visibility}</Badge></Link>) : <p className="p-4 text-sm text-muted-foreground">Your workspace is ready. Create your first project to start syncing your codebase.</p>}</div></section><ProjectOnboarding /></div></div>;
}
