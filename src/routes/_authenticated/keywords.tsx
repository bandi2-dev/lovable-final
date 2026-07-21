import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Search, TrendingUp, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { matchJd } from "@/lib/resume/jd-match";
import { useUserCurrent } from "@/lib/analysis-store";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/keywords")({
  component: KeywordsPage,
});

function KeywordsPage() {
  const current = useUserCurrent();
  const [resumeText, setResumeText] = useState(current?.resumeText ?? "");
  const [jdText, setJdText] = useState(current?.jdText ?? "");

  const result = useMemo(() => matchJd(resumeText, jdText), [resumeText, jdText]);
  const overlap = result.overlapPercent;

  return (
    <div className="relative">
      <FloatingOrbs />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <Search className="h-3.5 w-3.5" /> Keyword Explorer
          </div>
          <h1 className="mt-2 text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Live keyword match
          </h1>
          <p className="mt-1 text-white/60">
            Paste any resume + job description on the fly. Nothing is saved — just experiment.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
          >
            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Resume text</div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={14}
              placeholder="Paste resume content…"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-fuchsia-400/60"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
          >
            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">Job description</div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={14}
              placeholder="Paste job description…"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Overlap</div>
              <div className="text-4xl font-bold mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {overlap}
                <span className="text-lg text-white/40">%</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/60">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {result.matched.length} matched</div>
              <div className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-rose-400" /> {result.missing.length} missing</div>
            </div>
          </div>

          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              key={overlap}
              initial={{ width: 0 }}
              animate={{ width: `${overlap}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 via-fuchsia-400 to-indigo-400"
            />
          </div>
        </motion.div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ChipCard title="Matched keywords" items={result.matched} tone="good" />
          <ChipCard title="Missing keywords" items={result.missing} tone="bad" copyable />
        </div>

        {jdText.trim() === "" && (
          <div className="mt-8 flex items-center gap-2 text-sm text-white/50">
            <TrendingUp className="h-4 w-4" /> Paste a job description to see keyword gaps.
          </div>
        )}
      </div>
    </div>
  );
}

function ChipCard({
  title, items, tone, copyable,
}: {
  title: string; items: string[]; tone: "good" | "bad"; copyable?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-white/50">
          {title} ({items.length})
        </div>
        {copyable && items.length > 0 && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(items.join(", "));
              toast.success("Missing keywords copied");
            }}
            className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white"
          >
            <Copy className="h-3 w-3" /> Copy all
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-white/40">Nothing yet.</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((k, i) => (
            <motion.span
              key={k}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.01, 0.4) }}
              className={`text-xs px-2 py-1 rounded-md border ${
                tone === "good"
                  ? "bg-emerald-500/10 border-emerald-400/20 text-emerald-200"
                  : "bg-rose-500/10 border-rose-400/20 text-rose-200"
              }`}
            >
              {k}
            </motion.span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
