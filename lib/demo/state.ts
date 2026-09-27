export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ChangeStatus =
  | "detected"
  | "analyzing"
  | "fixing"
  | "validating"
  | "awaiting-approval"
  | "integrating"
  | "integrated"
  | "blocked";
export type PipelineStage =
  | "detected"
  | "impact"
  | "fix"
  | "validation"
  | "risk"
  | "integration";

export interface Owner {
  name: string;
  role: string;
  initials: string;
  status: string;
  component: string;
}

export interface RepoConsumer {
  repo: string;
  component: string;
  owner: string;
  state: "patched" | "awaiting" | "healthy" | "affected" | "blocked";
  files: number;
}

export interface SyncChange {
  id: string;
  num: number;
  title: string;
  from: string;
  to: string;
  repo: string;
  author: string;
  authorRole: string;
  time: string;
  sha: string;
  risk: RiskLevel;
  status: ChangeStatus;
  breaking: boolean;
  files: string[];
  consumers: RepoConsumer[];
  aiActions: { label: string; state: "done" | "active" | "pending" | "blocked" }[];
  tests: { passed: number; total: number };
  reason: string;
  diff: { file: string; lang: string; removed: string[]; added: string[] }[];
  commit?: string;
  summary?: string;
  recommendation?: string;
  potentialOwners?: string[];
  impact?: string[];
  affectedTeams?: string[];
  reasoning?: string;
}

export const TEAM = [
  { name: "Aqib", role: "Frontend Engineer", initials: "AQ", owns: ["frontend-web / UserService", "frontend-web / UserProfile"], current: "Working on UserProfile", state: "active" as const, changes: 2, color: "#7dd3fc" },
  { name: "Rahul", role: "Backend Engineer", initials: "RH", owns: ["backend-api / User API", "backend-api / Auth"], current: "Changed User API contract", state: "author" as const, changes: 1, color: "#c4b5fd" },
  { name: "Sara", role: "Mobile Engineer", initials: "SR", owns: ["mobile-app / UserService", "mobile-app / ProfileScreen"], current: "Reviewing downstream patch", state: "review" as const, changes: 1, color: "#6ee7b7" },
  { name: "Mina", role: "Data Engineer", initials: "MN", owns: ["analytics-worker / ETL"], current: "Monitoring pipeline", state: "idle" as const, changes: 0, color: "#fcd34d" },
];

export const REPOS = [
  { name: "frontend-web", stack: "React / TypeScript", owner: "Aqib", status: "patched" as const, note: "Patch generated · tests 18/18", commits: 1240, lang: "TS" },
  { name: "backend-api", stack: "Node / TypeScript", owner: "Rahul", status: "breaking" as const, note: "Contract change detected · #1042", commits: 2318, lang: "TS" },
  { name: "mobile-app", stack: "React Native", owner: "Sara", status: "awaiting" as const, note: "Patch awaiting approval", commits: 986, lang: "TS" },
  { name: "analytics-worker", stack: "Python / dbt", owner: "Mina", status: "healthy" as const, note: "Healthy · last run 4m ago", commits: 412, lang: "PY" },
];

export const CHANGES: SyncChange[] = [
  {
    id: "1042",
    num: 1042,
    title: "Authentication middleware update",
    from: "Authentication Middleware",
    to: "Workspace Authorization",
    repo: "changemind-web",
    author: "Rahul",
    authorRole: "Backend",
    time: "just now",
    sha: "b7a4f21",
    risk: "HIGH",
    status: "detected",
    breaking: true,
    files: ["src/auth/middleware.ts", "src/auth/session.ts", "src/dashboard/layout.tsx", "src/api/projects.ts"],
    consumers: [
      { repo: "Authentication", component: "Middleware", owner: "Rahul", state: "affected", files: 2 },
      { repo: "Dashboard", component: "Protected layout", owner: "Aqib", state: "affected", files: 1 },
      { repo: "Projects API", component: "Route authorization", owner: "Sara", state: "affected", files: 1 },
    ],
    aiActions: [
      { label: "Change Capsule created", state: "done" },
      { label: "Impact Graph updated", state: "done" },
      { label: "Approval requested", state: "active" },
    ],
    tests: { passed: 4, total: 4 },
    reason: "The authentication middleware is used by multiple downstream components. Changes may affect workspace authorization and protected routes.",
    commit: "Update authentication middleware",
    summary: "Authentication middleware and session handling changed across protected dashboard and Projects API paths.",
    recommendation: "Review authentication and workspace authorization dependencies before integrating this change.",
    potentialOwners: ["Rahul · Authentication", "Aqib · Dashboard", "Sara · Projects API"],
    diff: [
      { file: "src/auth/middleware.ts", lang: "ts", removed: ["  return allowRequest(request);"], added: ["  return enforceWorkspaceAuthorization(request);"] },
      { file: "src/auth/session.ts", lang: "ts", removed: ["  session.workspace = undefined;"], added: ["  session.workspace = resolveWorkspace(session);"] },
    ],
  },
  {
    id: "1041",
    num: 1041,
    title: "Auth.refresh() expiry 24h → 12h",
    from: "expiry: 24h",
    to: "expiry: 12h",
    repo: "backend-api",
    author: "Rahul",
    authorRole: "Backend",
    time: "2 hours ago",
    sha: "77bd410",
    risk: "LOW",
    status: "integrated",
    breaking: false,
    files: ["src/auth/session.ts"],
    consumers: [
      { repo: "frontend-web", component: "AuthClient", owner: "Aqib", state: "patched", files: 2 },
      { repo: "mobile-app", component: "SessionStore", owner: "Sara", state: "patched", files: 2 },
    ],
    aiActions: [
      { label: "Session patch generated", state: "done" },
      { label: "Token refresh tests passed", state: "done" },
    ],
    tests: { passed: 12, total: 12 },
    reason: "Config-only change. Auto-integrated.",
    diff: [
      { file: "src/auth/session.ts", lang: "ts", removed: ["  REFRESH_TTL = 24 * 3600;"], added: ["  REFRESH_TTL = 12 * 3600;"] },
    ],
  },
  {
    id: "1040",
    num: 1040,
    title: "payments.charge() signature v2",
    from: "charge(token)",
    to: "charge(paymentMethodId, idempotencyKey)",
    repo: "backend-api",
    author: "Rahul",
    authorRole: "Backend",
    time: "yesterday",
    sha: "e01c9d2",
    risk: "HIGH",
    status: "blocked",
    breaking: true,
    files: ["src/payments/charge.ts", "openapi.yaml"],
    consumers: [
      { repo: "frontend-web", component: "CheckoutForm", owner: "Aqib", state: "blocked", files: 5 },
      { repo: "mobile-app", component: "Paywall", owner: "Sara", state: "affected", files: 4 },
    ],
    aiActions: [
      { label: "Impact mapped across 2 consumers", state: "done" },
      { label: "Auto-integration blocked by policy", state: "blocked" },
      { label: "Migration draft ready for review", state: "pending" },
    ],
    tests: { passed: 6, total: 9 },
    reason: "Payment path modification. Blocked by high-risk policy.",
    diff: [
      { file: "src/payments/charge.ts", lang: "ts", removed: ["  async charge(token: string)"], added: ["  async charge(paymentMethodId: string, idempotencyKey: string)"] },
    ],
  },
];

export const PIPELINE_STEPS: { id: PipelineStage; label: string; hint: string }[] = [
  { id: "detected", label: "Change detected", hint: "webhook · push" },
  { id: "impact", label: "Impact analysis", hint: "3 consumers" },
  { id: "fix", label: "Downstream fix", hint: "AI patch" },
  { id: "validation", label: "Validation", hint: "tests · types" },
  { id: "risk", label: "Risk decision", hint: "policy gate" },
  { id: "integration", label: "Integration", hint: "merge · deploy" },
];

export const DEMO_SEQUENCE = [
  { t: 300, log: "Change detected: Update authentication middleware", stage: 0 },
  { t: 900, log: "Analyzing authentication middleware and session dependencies", stage: 1 },
  { t: 1500, log: "Change Capsule created with 4 changed files and 3 potential owners", stage: 2 },
  { t: 2100, log: "Impact Graph updated: Authentication → Session → Dashboard → Projects API → Workspace Authorization", stage: 2 },
  { t: 2700, log: "Risk classified: HIGH — protected routes and workspace authorization are affected", stage: 4 },
  { t: 3300, log: "ChangeMind Agent recommendation: review authentication and workspace authorization dependencies", stage: 4 },
  { t: 3900, log: "Approval requested — automatic integration is blocked by policy", stage: 5 },
] as const;

export const HIGH_RISK_SEQUENCE = [
  { t: 400, log: "High-risk change detected on backend-api@e01c9d2 — payments.charge()", stage: 0 },
  { t: 1500, log: "Impact analysis: payment path touches CheckoutForm + Paywall", stage: 1 },
  { t: 2700, log: "AI analysis completed · migration draft generated", stage: 2 },
  { t: 3900, log: "Validation running… 6/9 tests passed · 3 failing on idempotency", stage: 3 },
  { t: 5200, log: "Risk classified: HIGH — payment mutation detected", stage: 4 },
  { t: 6400, log: "Automatic integration BLOCKED by policy · human approval required", stage: 5 },
] as const;
