import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { CheckCircle2, AlertCircle, Copy, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAnalysisStore, useUserCurrent, type AnalysisRecord } from "@/lib/analysis-store";

export const Route = createFileRoute("/_authenticated/results")({
  component: ResultsPage,
});

function ResultsPage() {
  const current = useUserCurrent();
  const aiLoading = useAnalysisStore((s) => s.aiLoading);
  const navigate = useNavigate();

  useEffect(() => {
    if (!current) navigate({ to: "/dashboard" });
  }, [current, navigate]);

  if (!current) return null;

  const { ats, jd, ai, fileName } = current;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Analyze another
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your resume report
          </h1>
          <p className="mt-1 text-sm text-white/60">{fileName}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ScoreCard total={ats.total} />
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-white/80 mb-4">Category breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ats.categories.map((c) => ({ ...c, pct: Math.round((c.score / c.max) * 100) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, _n, e) => [`${e.payload.score}/${e.payload.max}`, e.payload.label]}
                />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  {ats.categories.map((c, i) => (
                    <Cell key={i} fill={c.score / c.max > 0.7 ? "#a78bfa" : c.score / c.max > 0.4 ? "#f472b6" : "#fb7185"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-1.5">
            {ats.categories.map((c) => (
              <div key={c.key} className="flex items-center justify-between text-xs text-white/60">
                <span>{c.label}</span>
                <span className="font-mono">{c.score}/{c.max} — {c.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {jd.matched.length + jd.missing.length > 0 && (
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/80">JD keyword match</h2>
            <div className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {jd.overlapPercent}
              <span className="text-sm text-white/40">% overlap</span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <KeywordChips title="Matched" items={jd.matched} tone="good" />
            <KeywordChips title="Missing from your resume" items={jd.missing} tone="bad" />
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <ListCard title="Strengths" items={ats.strengths} icon={CheckCircle2} tone="good" />
        <ListCard title="Issues to fix" items={ats.issues} icon={AlertCircle} tone="bad" />
      </div>

      <section className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/[0.08] to-indigo-500/[0.08] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-fuchsia-300" />
          <h2 className="text-sm font-semibold text-white/80">AI suggestions</h2>
          {ai?.mock && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-300/80 bg-amber-300/10 border border-amber-300/20 rounded-full px-2 py-0.5">
              Baseline
            </span>
          )}
        </div>

        {aiLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" /> Mistral is thinking…
          </div>
        ) : ai ? (
          <AiBlock ai={ai} />
        ) : (
          <p className="text-sm text-white/60">No AI suggestions available.</p>
        )}
      </section>
    </div>
  );
}

function ScoreCard({ total }: { total: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 1200);
      setDisplay(Math.round(total * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const dash = (display / 100) * 264;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center">
      <div className="text-xs font-medium uppercase tracking-widest text-white/50">ATS Score</div>
      <div className="relative h-52 w-52 mt-3">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
          <circle
            cx="50" cy="50" r="42"
            stroke="url(#scoreGrad)"
            strokeWidth="8" fill="none" strokeLinecap="round"
            strokeDasharray={`${dash} 264`}
            style={{ transition: "stroke-dasharray 0.1s linear" }}
          />
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-5xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{display}</div>
            <div className="text-xs text-white/40 mt-1">out of 100</div>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-white/60 text-center">
        {total >= 80 ? "Strong — ready to apply" : total >= 60 ? "Solid — a few tweaks recommended" : "Needs work — see suggestions below"}
      </div>
    </div>
  );
}

function KeywordChips({ title, items, tone }: { title: string; items: string[]; tone: "good" | "bad" }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-white/50 mb-2">{title} ({items.length})</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((k) => (
          <span
            key={k}
            className={`text-xs px-2 py-1 rounded-md border ${
              tone === "good"
                ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
                : "bg-rose-500/10 border-rose-400/20 text-rose-200"
            }`}
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}

function ListCard({
  title, items, icon: Icon, tone,
}: {
  title: string; items: string[]; icon: React.ComponentType<{ className?: string }>; tone: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-4 w-4 ${tone === "good" ? "text-emerald-300" : "text-rose-300"}`} />
        <h3 className="text-sm font-semibold text-white/80">{title}</h3>
      </div>
      {items.length ? (
        <ul className="space-y-2 text-sm text-white/70">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className={tone === "good" ? "text-emerald-400" : "text-rose-400"}>•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-white/40">None detected.</p>
      )}
    </div>
  );
}

function AiBlock({ ai }: { ai: NonNullable<AnalysisRecord["ai"]> }) {
  if (!ai) return null;
  return (
    <div className="space-y-6">
      <p className="text-sm text-white/80 leading-relaxed">{ai.summary}</p>

      {Object.keys(ai.sectionFeedback).length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Section feedback</div>
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(ai.sectionFeedback).map(([section, msg]) => (
              <div key={section} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300/80 mb-1">{section}</div>
                <p className="text-sm text-white/70 leading-relaxed">{msg}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ai.rewrittenBullets.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Rewritten bullets</div>
          <div className="space-y-2">
            {ai.rewrittenBullets.map((b, i) => (
              <div key={i} className="group flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                <span className="text-xs text-white/40 mt-0.5">{i + 1}.</span>
                <p className="flex-1 text-sm text-white/80 leading-relaxed">{b}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(b);
                    toast.success("Copied");
                  }}
                  className="opacity-0 group-hover:opacity-100 transition rounded p-1 hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5 text-white/60" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {ai.actionItems.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Action items</div>
          <ol className="space-y-1.5 text-sm text-white/80">
            {ai.actionItems.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-fuchsia-300 font-mono">{i + 1}.</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
