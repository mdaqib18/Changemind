"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";

export type WorkspaceRole = "owner" | "admin" | "developer" | "viewer";
export type WorkspaceProject = { id: string; name: string; slug: string; description: string | null; visibility: "private" | "internal" | "public"; repository?: { name: string; default_branch: string; is_demo: boolean } | null };
export type Workspace = { id: string; name: string; slug: string; role: WorkspaceRole; projects: WorkspaceProject[] };

type AuthContextValue = {
  user: User | null; loading: boolean; configured: boolean; workspaces: Workspace[]; activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string) => void; refreshWorkspaces: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const demoWorkspace: Workspace = { id: "demo-workspace", name: "SyncCode Demo", slug: "synccode-demo", role: "owner", projects: [{ id: "demo-project", name: "frontend-web", slug: "frontend-web", description: "Demo workspace for change coordination.", visibility: "private", repository: { name: "shopx/frontend-web", default_branch: "main", is_demo: true } }] };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(hasSupabaseConfig ? [] : [demoWorkspace]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");

  const refreshWorkspaces = useCallback(async () => {
    const client = createSupabaseBrowserClient();
    if (!client) { setWorkspaces([demoWorkspace]); setActiveWorkspaceId("demo-workspace"); return; }
    await client.rpc("ensure_profile");
    const { data, error } = await client.from("workspace_members").select("role, workspaces ( id, name, slug, projects ( id, name, slug, description, visibility, repositories ( name, default_branch, is_demo ) ) )");
    if (error) return;
    const next = (data ?? []).flatMap((row) => {
      const workspace = Array.isArray(row.workspaces) ? row.workspaces[0] : row.workspaces;
      if (!workspace) return [];
      return [{ id: workspace.id, name: workspace.name, slug: workspace.slug, role: row.role as WorkspaceRole, projects: (workspace.projects ?? []).map((project) => ({ ...project, repository: Array.isArray(project.repositories) ? project.repositories[0] ?? null : project.repositories ?? null })) }];
    });
    setWorkspaces(next);
    setActiveWorkspaceId((current) => next.some((workspace) => workspace.id === current) ? current : next[0]?.id ?? "");
  }, []);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;
    client.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); if (data.user) void refreshWorkspaces(); });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { setUser(session?.user ?? null); if (session?.user) void refreshWorkspaces(); else setWorkspaces([]); });
    return () => listener.subscription.unsubscribe();
  }, [refreshWorkspaces]);

  const signOut = useCallback(async () => { const client = createSupabaseBrowserClient(); if (client) await client.auth.signOut(); }, []);
  const value = useMemo(() => ({ user, loading, configured: hasSupabaseConfig, workspaces, activeWorkspace: workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null, setActiveWorkspaceId, refreshWorkspaces, signOut }), [user, loading, workspaces, activeWorkspaceId, refreshWorkspaces, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context; }
