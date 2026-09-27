import { NextResponse } from "next/server";
import { DEMO_ANALYSIS, type ChangeAnalysis } from "@/lib/change-analysis";

type ChangeInput = { repository: string; commit: string; filesChanged: string[]; components: string[] };
const risks = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

function isChangeInput(value: unknown): value is ChangeInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Partial<ChangeInput>;
  return typeof input.repository === "string" && typeof input.commit === "string"
    && Array.isArray(input.filesChanged) && input.filesChanged.every((file) => typeof file === "string")
    && Array.isArray(input.components) && input.components.every((component) => typeof component === "string");
}

function isAnalysis(value: unknown): value is ChangeAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<ChangeAnalysis>;
  return typeof analysis.risk === "string" && risks.has(analysis.risk)
    && typeof analysis.summary === "string" && analysis.summary.length > 0
    && Array.isArray(analysis.impact) && analysis.impact.every((item) => typeof item === "string")
    && Array.isArray(analysis.affectedTeams) && analysis.affectedTeams.every((item) => typeof item === "string")
    && typeof analysis.recommendation === "string" && analysis.recommendation.length > 0
    && typeof analysis.reasoning === "string" && analysis.reasoning.length > 0;
}

function fallback() { return NextResponse.json({ analysis: DEMO_ANALYSIS, source: "demo" as const }); }

export async function POST(request: Request) {
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid analysis request." }, { status: 400 }); }
  if (!isChangeInput(input)) return NextResponse.json({ error: "Invalid analysis request." }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback();

  const prompt = `Return ONLY valid JSON matching the requested schema. Only reason from supplied change information. Clearly indicate uncertainty. Do not claim files were executed or tested, a PR was merged, an integration occurred, or ownership not supported by the input.\n\n${JSON.stringify(input)}`;
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              risk: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] }, summary: { type: "STRING" },
              impact: { type: "ARRAY", items: { type: "STRING" } }, affectedTeams: { type: "ARRAY", items: { type: "STRING" } },
              recommendation: { type: "STRING" }, reasoning: { type: "STRING" },
            },
            required: ["risk", "summary", "impact", "affectedTeams", "recommendation", "reasoning"],
          },
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return fallback();
    const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallback();
    const analysis: unknown = JSON.parse(text);
    return isAnalysis(analysis) ? NextResponse.json({ analysis, source: "gemini" as const }) : fallback();
  } catch { return fallback(); }
}
