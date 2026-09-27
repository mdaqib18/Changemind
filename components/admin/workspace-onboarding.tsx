"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function WorkspaceOnboarding() {
  const { refreshWorkspaces } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSaving(true);
    const response = await fetch("/api/workspaces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await response.json() as { error?: string }; setSaving(false);
    if (!response.ok) return setError(data.error ?? "Unable to create the workspace.");
    await refreshWorkspaces();
  }
  return <section className="mx-auto mt-12 max-w-xl sc-panel p-6"><Sparkles className="size-5 text-violet-300" /><p className="mt-5 text-[10px] font-semibold tracking-[0.14em] text-violet-300 uppercase">Workspace setup</p><h1 className="mt-2 text-xl font-semibold tracking-tight">Create your workspace</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">A workspace is the boundary for your projects, collaborators, and connected repositories.</p><form onSubmit={submit} className="mt-6 space-y-3"><label className="block text-xs font-medium">Workspace name<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} autoFocus className="mt-1.5 h-9 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm outline-none focus:border-violet-400/60" placeholder="Acme Engineering" /></label>{error && <p role="alert" className="text-xs text-amber-300">{error}</p>}<Button disabled={saving} type="submit">{saving && <LoaderCircle className="size-3.5 animate-spin" />}Create workspace</Button></form></section>;
}
