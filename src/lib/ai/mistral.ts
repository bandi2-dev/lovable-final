import { env, aiEnabled, hasMistralKey } from "@/lib/env";
import type { AtsResult } from "@/lib/resume/ats";
import type { JdMatch } from "@/lib/resume/jd-match";

export interface AiSuggestions {
  disabled?: boolean;
  reason?: string;
  summary: string;
  sectionFeedback: Record<string, string>;
  rewrittenBullets: string[];
  actionItems: string[];
  mock?: boolean;
}

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume coach.
Given a candidate's resume text, a job description, and an ATS score breakdown,
produce concrete, honest improvement suggestions.

Respond ONLY with valid JSON matching this shape:
{
  "summary": "2-3 sentence overview",
  "sectionFeedback": {
    "experience": "...",
    "skills": "...",
    "education": "...",
    "projects": "..."
  },
  "rewrittenBullets": ["5 stronger bullet rewrites drawn from the resume"],
  "actionItems": ["3-6 short, prioritized next steps"]
}

Be specific. Reference real terms from the resume and JD. No preamble, no markdown.`;

export async function getSuggestions(input: {
  resumeText: string;
  jdText: string;
  ats: AtsResult;
  jd: JdMatch;
}): Promise<AiSuggestions> {
  // Deterministic mock for test env or when AI is disabled/no key
  if (!aiEnabled) {
    return buildFallback(input, {
      disabled: true,
      reason: hasMistralKey
        ? "AI is disabled in this environment (VITE_ENABLE_AI=false)."
        : "Add VITE_MISTRAL_API_KEY to your .env file to enable AI suggestions.",
    });
  }

  try {
    const { Mistral } = await import("@mistralai/mistralai");
    const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });

    const userPrompt = buildUserPrompt(input);

    const resp = await client.chat.complete({
      model: env.MISTRAL_MODEL,
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.map((p) => ("text" in p ? p.text : "")).join("") : "";
    const parsed = safeParseJson(text);
    if (!parsed) return buildFallback(input, { reason: "AI response could not be parsed. Showing baseline suggestions." });
    return normalize(parsed);
  } catch (err) {
    console.error("Mistral call failed:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return buildFallback(input, { reason: `AI call failed: ${msg}. Showing baseline suggestions.` });
  }
}

function buildUserPrompt({ resumeText, jdText, ats, jd }: {
  resumeText: string; jdText: string; ats: AtsResult; jd: JdMatch;
}): string {
  return `RESUME:
${resumeText.slice(0, 6000)}

JOB DESCRIPTION:
${jdText.slice(0, 3000) || "(not provided)"}

ATS SCORE: ${ats.total}/100
Category breakdown: ${ats.categories.map((c) => `${c.label}=${c.score}/${c.max}`).join(", ")}
Detected strengths: ${ats.strengths.join("; ") || "(none)"}
Detected issues: ${ats.issues.join("; ") || "(none)"}
Matched JD keywords: ${jd.matched.slice(0, 20).join(", ")}
Missing JD keywords: ${jd.missing.slice(0, 20).join(", ")}`;
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Try to grab the first {...} block
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* ignore */ }
    }
    return null;
  }
}

function normalize(obj: unknown): AiSuggestions {
  const o = (obj ?? {}) as Record<string, unknown>;
  const feedback = (o.sectionFeedback ?? {}) as Record<string, unknown>;
  return {
    summary: String(o.summary ?? "").trim() || "No summary returned.",
    sectionFeedback: Object.fromEntries(
      Object.entries(feedback).map(([k, v]) => [k, String(v ?? "")]),
    ),
    rewrittenBullets: Array.isArray(o.rewrittenBullets)
      ? o.rewrittenBullets.map(String).slice(0, 8)
      : [],
    actionItems: Array.isArray(o.actionItems)
      ? o.actionItems.map(String).slice(0, 8)
      : [],
  };
}

function buildFallback(
  { ats, jd }: { ats: AtsResult; jd: JdMatch },
  meta: { disabled?: boolean; reason?: string },
): AiSuggestions {
  const missing = jd.missing.slice(0, 6);
  const actionItems: string[] = [];
  if (ats.issues.length) actionItems.push(...ats.issues.slice(0, 3));
  if (missing.length) actionItems.push(`Weave these missing keywords into your resume where truthful: ${missing.join(", ")}`);
  actionItems.push("Add quantified impact to every bullet (%, $, counts, timeframes).");
  actionItems.push("Lead each bullet with a strong action verb (led, shipped, built, reduced).");

  return {
    ...meta,
    mock: true,
    summary:
      meta.reason ??
      `Baseline analysis. Your ATS score is ${ats.total}/100 with ${jd.overlapPercent}% JD keyword overlap.`,
    sectionFeedback: {
      experience: "Ensure each role has 3-5 bullets that combine an action verb, the work you did, and a measurable outcome.",
      skills: "Group skills by category (Languages, Frameworks, Cloud, Tools) and prioritize what the JD asks for.",
      education: "List degree, institution, graduation year. Include GPA only if strong (>= 8.0/10 or 3.5/4).",
      projects: "Pick 2-3 projects that most closely mirror the JD's stack and describe them in impact-first bullets.",
    },
    rewrittenBullets: [
      "Led migration of legacy monolith to a Node.js/TypeScript microservices architecture, cutting p95 latency by 42%.",
      "Built a React + Tailwind analytics dashboard used by 300+ internal users; adopted org-wide within 2 quarters.",
      "Automated deployment with Docker + GitHub Actions, reducing release time from 2 hours to 8 minutes.",
      "Designed a Postgres schema and REST API supporting 1M+ records with sub-100ms queries.",
      "Mentored 4 junior engineers, running weekly code reviews and pairing sessions; 2 were promoted within a year.",
    ],
    actionItems,
  };
}
