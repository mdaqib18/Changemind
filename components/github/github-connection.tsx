"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { ConnectGitHubButton } from "./connect-github-button";

type Status = "loading" | "connected" | "disconnected" | "unavailable";

export function GitHubConnection() {
  const { activeWorkspace } = useAuth();
  const [connection, setConnection] = useState<{ workspaceId: string; status: Status } | null>(null);
  const canCheck = hasSupabaseConfig && Boolean(activeWorkspace);
  const status = !canCheck ? "unavailable" : connection && connection.workspaceId === activeWorkspace?.id ? connection.status : "loading";

  useEffect(() => {
    if (!canCheck || !activeWorkspace) return;
    const client = createSupabaseBrowserClient();
    if (!client) return;
    let cancelled = false;
    const workspaceId = activeWorkspace.id;
    void client.from("github_installations").select("id").eq("workspace_id", workspaceId).limit(1).maybeSingle().then(({ data, error }) => {
      if (!cancelled) setConnection({ workspaceId, status: error ? "unavailable" : data ? "connected" : "disconnected" });
    });
    return () => { cancelled = true; };
  }, [activeWorkspace, canCheck]);

  if (status === "loading") return <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" />Checking GitHub connection…</span>;
  if (status === "connected") return <Badge variant="ok"><Check className="size-3" />GitHub Connected</Badge>;
  if (status === "unavailable") return <span className="text-xs text-muted-foreground">GitHub connection status is unavailable.</span>;
  if (activeWorkspace && !["owner", "admin"].includes(activeWorkspace.role)) return <span className="text-xs text-muted-foreground">A workspace owner or admin can connect GitHub.</span>;
  return <ConnectGitHubButton workspaceId={activeWorkspace?.id} />;
}
