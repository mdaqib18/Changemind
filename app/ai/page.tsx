"use client";

import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel, Separator } from "@/components/ui/primitives";
import { AIExecutionLog } from "@/components/synccode/ai-log";
import { useDemo } from "@/lib/store";

const RUNS = [
  { id: "#1042", title: "User.name → User.full_name", steps: 6, result: "Mobile approval pending", tone: "warn" as const },
  { id: "#1041", title: "Session TTL 24h → 12h", steps: 6, result: "Integrated · 12/12", tone: "ok" as const },
  { id: "#1040", title: "payments.charge() v2", steps: 6, result: "Blocked by policy", tone: "err" as const },
];
void RUNS;

export default function AIPage() {
  const { phase, agentRuns, changes, requestApproval, analysis, analysisSource } = useDemo();
  const change = changes.find((item) => item.id === "1042")!;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[19px] font-semibold tracking-tight">AI Activity</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Not a chatbot — an agent operating the development pipeline.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="sc-panel p-4" aria-label="Current run">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-violet-500/15 text-violet-200"><Sparkles className="size-3.5" /></span>
            <div>
              <p className="text-[13px] font-semibold">ChangeMind Agent · analyzing change #1042</p>
              <p className="sc-mono text-[10px] text-muted-foreground">run_9f31 · {phase === "running" ? "operating…" : "last run complete"}</p>
            </div>
            <Badge variant="ai" className="ml-auto">{phase === "running" ? "Operating" : "Idle"}</Badge>
          </div>
          <Separator className="my-3 opacity-60" />
          <ul className="space-y-1.5 text-[13px]">
            {[
              "Authentication middleware update detected",
              ...analysis.impact,
              "Change Capsule and Impact Graph updated",
              `${analysis.risk} risk policy gate applied`,
            ].map((s) => (
              <li key={s} className="flex items-center gap-2 text-foreground/85"><Check className="size-3.5 text-emerald-300" /> {s}</li>
            ))}
          </ul>
          <div className="sc-inset mt-3 p-2.5">
            <SectionLabel>Recommendation</SectionLabel>
            <p className="mt-1 text-[13px] font-medium text-amber-200">{change.recommendation}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{analysis.reasoning}</p>
            {analysisSource === "demo" && <Badge variant="muted" className="mt-2">Demo analysis</Badge>}
            {phase === "ready" ? <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-200"><Check className="size-3.5" />Ready for integration</p> : <div className="mt-3 flex gap-2"><Button size="sm" onClick={requestApproval}>Request Approval</Button><Button size="sm" variant="outline" asChild><Link href="/approvals">View approval</Link></Button></div>}
          </div>
        </section>
        <div className="space-y-4">
          <section className="sc-panel p-3.5" aria-label="Live log"><AIExecutionLog /></section>
          <section className="sc-panel p-3.5" aria-label="Past runs">
            <SectionLabel>Recent runs</SectionLabel>
            <ul className="mt-2 divide-y divide-white/[0.05]">
              {agentRuns.map((r) => (
                <li key={r.id} className="flex items-center gap-2 py-2 text-xs">
                  <span className="sc-mono text-muted-foreground">{r.id}</span>
                  <span className="min-w-0 flex-1 truncate text-foreground/85">{r.task}</span>
                  <span className={r.status === "completed" ? "text-emerald-300" : r.status === "blocked" ? "text-red-300" : "text-amber-300"}>{r.status}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
