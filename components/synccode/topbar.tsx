"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CheckCircle2, ChevronDown, GitPullRequest, LogOut, Menu, Play, Search, Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/primitives";
import { useDemo } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function Topbar({ onMenu, onPalette, onAgent, onWorkspaceContext }: { onMenu: () => void; onPalette: () => void; onAgent: () => void; onWorkspaceContext: () => void }) {
  const { runDemo, phase, reset } = useDemo();
  const { activeWorkspace, workspaces, setActiveWorkspaceId, user, signOut } = useAuth();
  const router = useRouter(); const pathname = usePathname();
  const selectedProjectId = pathname.match(/^\/dashboard\/([^/]+)/)?.[1] ?? "";
  const [confirmHigh, setConfirmHigh] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="relative z-40 flex h-14 shrink-0 min-w-0 items-center gap-2 border-b border-white/[0.06] bg-[#0a0a0b]/85 px-4 backdrop-blur-md sm:px-5">
      <button className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu className="size-4" />
      </button>

      <button
        onClick={onPalette}
        className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs text-muted-foreground transition-colors hover:border-white/15 hover:text-foreground xl:max-w-[300px]"
        aria-label="Open command palette"
      >
        <Search className="size-3.5" />
        <span className="min-w-0 flex-1 truncate text-left">Search changes, repos, owners…</span>
        <span className="hidden items-center gap-0.5 sm:flex"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
      </button>

      <div className="hidden items-center gap-1.5 border-l border-white/[0.07] pl-3 2xl:flex">
        <select value={activeWorkspace?.id ?? ""} onChange={(event) => setActiveWorkspaceId(event.target.value)} className="max-w-32 appearance-none bg-transparent text-xs font-medium text-foreground/90 outline-none">
          {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
        </select><span className="text-xs text-muted-foreground">/</span><select aria-label="Switch project" value={selectedProjectId} onChange={(event) => event.target.value === "new" ? router.push("/admin") : router.push(`/dashboard/${event.target.value}`)} className="max-w-40 appearance-none bg-transparent text-xs text-muted-foreground outline-none"><option value="">Select project</option>{activeWorkspace?.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}<option value="new">+ Create project</option></select><button onClick={onWorkspaceContext} aria-label="Open workspace context"><ChevronDown className="size-3 text-muted-foreground" /></button>
      </div>
      <span className="hidden items-center gap-1.5 text-[11px] text-emerald-200 2xl:flex"><span className="size-1.5 rounded-full bg-emerald-400" />Workspace connected</span>

      <div className="ml-auto flex items-center gap-1.5">
        <span className={cn("sc-mono hidden rounded border px-1.5 py-1 text-[10px] 2xl:block", phase === "running" ? "border-violet-400/30 text-violet-200" : "border-white/10 text-muted-foreground")}>
          {phase === "running" ? "● LIVE DEMO" : phase === "done" ? "● DEMO COMPLETE" : phase === "ready" ? "● READY FOR INTEGRATION" : phase === "blocked" ? "● APPROVAL NEEDED" : "○ ENGINE IDLE"}
        </span>
        <span className="hidden items-center gap-1 rounded border border-emerald-400/20 bg-emerald-400/[0.05] px-1.5 py-1 text-[10px] text-emerald-200 2xl:flex"><GitPullRequest className="size-3" /> GitHub connected</span>
        <button onClick={onAgent} className="hidden h-8 items-center gap-1 rounded-md border border-violet-300/20 bg-violet-400/[0.08] px-2 text-[11px] font-medium text-violet-100 hover:bg-violet-400/[0.14] md:flex" aria-label="Open Sync Agent"><Sparkles className="size-3.5" />Sync Agent <span className="ml-0.5 text-violet-200/65">⌘J</span></button>
        {phase !== "idle" ? (
          <Button size="sm" variant="ghost" onClick={reset}>Reset</Button>
        ) : null}
        <Button
          size="sm"
          variant="outline"
          className="hidden xl:inline-flex"
          onClick={() => {
            if (!confirmHigh) {
              setConfirmHigh(true);
              window.setTimeout(() => setConfirmHigh(false), 3000);
              return;
            }
            setConfirmHigh(false);
            runDemo("high-risk");
          }}
        >
          <TriangleAlert className="size-3.5 text-amber-300" />
          {confirmHigh ? "Confirm high-risk?" : "High-risk"}
        </Button>
        <Button size="sm" onClick={() => runDemo("breaking")} aria-label="Simulate demo workflow">
          <Play className="size-3.5" /> <span className="hidden xl:inline">Simulate</span><span className="xl:hidden">Run</span>
        </Button>
        <div className="relative">
          <button onClick={() => setNotificationsOpen((v) => !v)} aria-label="Open notifications" aria-expanded={notificationsOpen} className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground">
            <Bell className="size-4" /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-amber-300" />
          </button>
          {notificationsOpen && <section className="sc-rise absolute right-0 top-9 z-50 w-[310px] overflow-hidden rounded-lg border border-white/10 bg-[#161618] shadow-2xl" aria-label="Notifications">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-3 py-2"><span className="text-xs font-semibold">Notifications</span><span className="text-[10px] text-muted-foreground">3 unread</span></div>
            {[
              ["Your component is affected by Change #1042", "UserService · just now"],
              ["Approval required for mobile downstream patch", "Change #1042 · 2m"],
              ["Change #1041 was automatically integrated", "Validation passed · 8m"],
            ].map(([title, sub]) => <div key={title} className="flex gap-2 border-b border-white/[0.05] px-3 py-2.5 last:border-0"><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-violet-300" /><div><p className="text-xs text-foreground/90">{title}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p></div></div>)}
          </section>}
        </div>
        <button aria-label="Open account menu" className="hidden size-8 items-center justify-center rounded-full border border-white/10 bg-sky-300/10 text-[10px] font-semibold text-sky-200 sm:flex">{(user?.email?.slice(0, 2) ?? "AQ").toUpperCase()}</button>
        {user && <button onClick={() => void signOut()} aria-label="Sign out" className="hidden size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06] hover:text-foreground sm:flex"><LogOut className="size-3.5" /></button>}
      </div>
    </header>
  );
}
