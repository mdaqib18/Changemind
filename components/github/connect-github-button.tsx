"use client";

import { GitBranch } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ConnectGitHubButton({ workspaceId }: { workspaceId?: string }) {
  const href = workspaceId ? `/api/github/install?workspace_id=${encodeURIComponent(workspaceId)}` : "/api/github/install";
  return <Button asChild><Link href={href}><GitBranch className="size-3.5" />Connect GitHub</Link></Button>;
}
