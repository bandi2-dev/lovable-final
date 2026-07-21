import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Trash2, ArrowRight, History as HistoryIcon, Search } from "lucide-react";
import { useState } from "react";
import { useAnalysisStore, useUserHistory } from "@/lib/analysis-store";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const history = useUserHistory();
  const loadFromHistory = useAnalysisStore((s) => s.loadFromHistory);
  const removeFromHistory = useAnalysisStore((s) => s.removeFromHistory);
  const clearHistory = useAnalysisStore((s) => s.clearHistory);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = history.filter((h) =>
    h.fileName.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative">
      <FloatingOrbs />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <HistoryIcon className="h-3.5 w-3.5" /> Analysis History
          </div>
          <h1 className="mt-2 text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your past analyses
          </h1>
          <p className="mt-1 text-white/60">Every resume you've analyzed is saved locally in your browser.</p>
        </motion.div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file name…"
              className="w-full rounded-full bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-fuchsia-400/60"
            />
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                clearHistory();
                toast.success("History cleared");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-rose-300 transition px-3 py-2"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center text-white/40">No matches for "{query}".</div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((h, i) => (
                <motion.div
                  key={h.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -4 }}
                  className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl overflow-hidden"
                >
                  <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full blur-3xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition" />
                  <div className="relative flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-fuchsia-300 shrink-0" />
                      <span className="truncate text-sm font-medium">{h.fileName}</span>
                    </div>
                    <button
                      onClick={() => removeFromHistory(h.id)}
                      className="opacity-0 group-hover:opacity-100 transition rounded p-1 hover:bg-rose-500/20 text-white/60 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="relative mt-4 flex items-end justify-between">
                    <div>
                      <div className="text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {h.ats.total}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-white/40">ATS Score</div>
                    </div>
                    {h.jd.overlapPercent > 0 && (
                      <div className="text-right">
                        <div className="text-lg font-semibold text-indigo-300">{h.jd.overlapPercent}%</div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">JD match</div>
                      </div>
                    )}
                  </div>

                  <div className="relative mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${h.ats.total}%` }}
                      transition={{ duration: 0.8, delay: 0.1 + i * 0.03 }}
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500"
                    />
                  </div>

                  <div className="relative mt-4 flex items-center justify-between text-xs text-white/50">
                    <span>{new Date(h.createdAt).toLocaleString()}</span>
                    <button
                      onClick={() => {
                        loadFromHistory(h.id);
                        navigate({ to: "/results" });
                      }}
                      className="inline-flex items-center gap-1 text-white/80 hover:text-white"
                    >
                      Open <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-16 rounded-2xl border border-dashed border-white/10 p-12 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 border border-white/10"
      >
        <HistoryIcon className="h-7 w-7 text-white/60" />
      </motion.div>
      <div className="mt-4 text-lg font-semibold">No analyses yet</div>
      <div className="mt-1 text-sm text-white/60">Run your first analysis to build your history.</div>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 transition"
      >
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
