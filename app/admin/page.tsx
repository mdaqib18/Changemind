"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FolderGit2, LayoutDashboard, Users } from "lucide-react";
import { GitHubConnection } from "@/components/github/github-connection";
import { ProjectOnboarding } from "@/components/admin/project-onboarding";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/primitives";
import { useAuth } from "@/lib/auth";
import { WorkspaceOnboarding } from "@/components/admin/workspace-onboarding";

export default function AdminPage() {
  return <Suspense fallback={<div className="text-sm text-muted-foreground">Loading workspace administration…</div>}><AdminPageContent /></Suspense>;
}

function AdminPageContent() {
  const { activeWorkspace, loading } = useAuth();
  const searchParams = useSearchParams();
  const githubStatus = searchParams.get("github");
  const githubError = githubStatus === "configuration_error" ? "GitHub App configuration is incomplete. Ask an administrator to configure it." : githubStatus === "workspace_required" ? "Create or select a workspace before connecting GitHub." : githubStatus === "permission_denied" ? "Only workspace owners and admins can connect GitHub." : githubStatus === "state_error" ? "We could not start the GitHub connection. Please try again." : githubStatus === "state_invalid" ? "Your GitHub connection session expired or was invalid. Please try again." : githubStatus === "installation_missing" ? "GitHub did not provide an installation ID." : githubStatus === "installation_verification_failed" ? "We could not verify the GitHub App installation." : githubStatus === "persistence_error" ? "We could not save the GitHub connection. Please try again." : githubStatus === "github_error" ? "GitHub cancelled or rejected the connection." : null;
  if (loading) return <div className="text-sm text-muted-foreground">Loading workspace administration…</div>;
  const projects = activeWorkspace?.projects ?? [];
  if (!activeWorkspace) return <WorkspaceOnboarding />;
  return <div className="space-y-5"><header className="sc-page-header"><div><p className="text-[10px] font-semibold tracking-[0.14em] text-violet-300 uppercase">Workspace administration</p><h1>{activeWorkspace.name}</h1><p>Projects, repository connections, and access controls.</p></div><Badge variant="ai" className="capitalize">{activeWorkspace.role}</Badge></header>{githubStatus === "connected" && <p role="status" className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2 text-xs text-emerald-200">GitHub Connected</p>}{githubError && <p role="alert" className="rounded-md border border-amber-400/20 bg-amber-400/[0.08] px-3 py-2 text-xs text-amber-200">{githubError}</p>}<section className="sc-panel flex flex-wrap items-center gap-3 p-3.5"><span className="flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]"><FolderGit2 className="size-4 text-muted-foreground" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">GitHub App</p><p className="text-xs text-muted-foreground">Connect a GitHub App installation to this ChangeMind Workspace.</p></div><GitHubConnection /></section><div className="grid gap-3 sm:grid-cols-3">{[[LayoutDashboard, "Projects", String(projects.length)], [FolderGit2, "Repositories", String(projects.filter((project) => project.repository).length)], [Users, "Your access", activeWorkspace.role]].map(([Icon, label, value]) => { const ItemIcon = Icon as typeof LayoutDashboard; return <section className="sc-panel p-3.5" key={label as string}><ItemIcon className="size-3.5 text-muted-foreground" /><p className="mt-3 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{label as string}</p><p className="mt-1 text-lg font-semibold capitalize">{value as string}</p></section>; })}</div><div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><section><div className="mb-2 flex items-center"><SectionLabel>Current projects</SectionLabel></div><div className="sc-panel overflow-hidden">{projects.length ? projects.map((project) => <Link href={`/dashboard/${project.id}`} key={project.id} className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3 last:border-0 hover:bg-white/[0.025]"><FolderGit2 className="size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="text-xs font-medium">{project.name}</p><p className="sc-mono truncate text-[10px] text-muted-foreground">{project.repository?.name ?? "No repository connected"}</p></div><Badge variant="muted">{project.visibility}</Badge></Link>) : <p className="p-4 text-sm text-muted-foreground">Your workspace is ready. Create your first project to start syncing your codebase.</p>}</div></section><ProjectOnboarding /></div></div>;
}
