import type { RiskLevel } from "@/lib/domain";

export type ChangeAnalysis = {
  risk: RiskLevel;
  summary: string;
  impact: string[];
  affectedTeams: string[];
  recommendation: string;
  reasoning: string;
};

export const DEMO_ANALYSIS: ChangeAnalysis = {
  risk: "HIGH",
  summary: "Authentication middleware changes may affect protected routes and workspace authorization.",
  impact: [
    "Protected routes may be affected",
    "Workspace authorization may require validation",
    "Downstream project access may change",
  ],
  affectedTeams: ["Platform Team", "Frontend Team"],
  recommendation: "Review authentication and workspace authorization dependencies before integration.",
  reasoning: "The changed authentication components are shared by multiple downstream areas.",
};
