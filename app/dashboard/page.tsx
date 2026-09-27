"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { activeWorkspace, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && activeWorkspace?.projects[0]) router.replace(`/dashboard/${activeWorkspace.projects[0].id}`); }, [activeWorkspace, loading, router]);
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Opening your workspace…</div>;
}
