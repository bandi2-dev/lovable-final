import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload, FileText, Sparkles, Loader2, X, TrendingUp, Target, Clock,
  History, Search, ArrowRight, Wand2, Zap, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { extractText } from "@/lib/resume/extract";
import { scoreResume } from "@/lib/resume/ats";
import { matchJd } from "@/lib/resume/jd-match";
import { getSuggestions } from "@/lib/ai/mistral";
import { useAnalysisStore, useUserHistory } from "@/lib/analysis-store";
import { useAuthStore } from "@/lib/auth-store";
import { env } from "@/lib/env";
import { FloatingOrbs } from "@/components/FloatingOrbs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdText, setJdText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const setCurrent = useAnalysisStore((s) => s.setCurrent);
  const setAi = useAnalysisStore((s) => s.setAi);
  const setAiLoading = useAnalysisStore((s) => s.setAiLoading);
  const history = useUserHistory();
  const session = useAuthStore((s) => s.session);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (history.length === 0) {
      return { count: 0, avg: 0, best: 0, lastAt: null as number | null };
    }
    const scores = history.map((h) => h.ats.total);
    return {
      count: history.length,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
      lastAt: history[0].createdAt,
    };
  }, [history]);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setExtracting(true);
    try {
      const text = await extractText(f);
      setResumeText(text);
      toast.success(`Extracted ${text.split(/\s+/).filter(Boolean).length} words from ${f.name}`);
    } catch (e) {
      toast.error(`Failed to read ${f.name}: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setExtracting(false);
    }
  }, []);

  async function analyze() {
    if (!resumeText.trim()) {
      toast.error("Upload a resume or paste text first");
      return;
    }
    setAnalyzing(true);
    const ats = scoreResume(resumeText, jdText);
    const jd = matchJd(resumeText, jdText);
    setCurrent({
      fileName: file?.name ?? "pasted-resume.txt",
      resumeText,
      jdText,
      ats,
      jd,
      ai: null,
      createdAt: Date.now(),
    });
    setAiLoading(true);
    navigate({ to: "/results" });

    getSuggestions({ resumeText, jdText, ats, jd })
      .then((ai) => setAi(ai))
      .catch((e) => {
        toast.error(`AI failed: ${e instanceof Error ? e.message : "unknown"}`);
        setAiLoading(false);
      });
  }

  const firstName = session?.name.split(" ")[0] ?? "there";

  return (
    <div className="relative">
      <FloatingOrbs />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
        >
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 backdrop-blur"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Mistral AI is online
            </motion.div>
            <h1
              className="mt-4 text-4xl md:text-5xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-fuchsia-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="mt-2 text-white/60">
              Drop a resume, add a job description, and get your ATS report in seconds.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/history"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition"
            >
              <History className="h-4 w-4" /> History
            </Link>
            <Link
              to="/cover-letter"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
            >
              <Wand2 className="h-4 w-4" /> Cover Letter
            </Link>
          </div>
        </motion.div>

        {/* Stat tiles */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile i={0} icon={FileText} label="Resumes analyzed" value={stats.count} accent="from-fuchsia-500/40 to-fuchsia-500/0" />
          <StatTile i={1} icon={TrendingUp} label="Average ATS score" value={stats.avg} suffix="/100" accent="from-indigo-500/40 to-indigo-500/0" />
          <StatTile i={2} icon={Target} label="Best score" value={stats.best} suffix="/100" accent="from-emerald-500/40 to-emerald-500/0" />
          <StatTile
            i={3}
            icon={Clock}
            label="Last analyzed"
            value={stats.lastAt ? relativeTime(stats.lastAt) : "—"}
            accent="from-amber-500/40 to-amber-500/0"
            isText
          />
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <QuickAction
            i={0}
            to="/keywords"
            icon={Search}
            title="Keyword Explorer"
            desc="Compare resume vs JD keywords with a live overlap heatmap."
            gradient="from-fuchsia-500/20 to-pink-500/10"
          />
          <QuickAction
            i={1}
            to="/cover-letter"
            icon={Wand2}
            title="AI Cover Letter"
            desc="Generate a tailored cover letter from your resume + JD."
            gradient="from-indigo-500/20 to-cyan-500/10"
          />
          <QuickAction
            i={2}
            to="/profile"
            icon={Zap}
            title="Your Profile"
            desc="Track your ATS growth, streaks, and personal insights."
            gradient="from-emerald-500/20 to-lime-500/10"
          />
        </div>

        {/* Main analyzer */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="grid place-items-center h-6 w-6 rounded-md bg-fuchsia-500/20 text-fuchsia-300 text-xs font-bold">1</div>
              <h2 className="text-sm font-semibold text-white/80">Resume</h2>
            </div>

            <label
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              className={`relative block cursor-pointer rounded-xl border-2 border-dashed transition-all p-8 text-center overflow-hidden ${
                dragActive
                  ? "border-fuchsia-400/60 bg-fuchsia-500/5 scale-[1.01]"
                  : "border-white/10 hover:border-white/20 bg-white/[0.02]"
              }`}
            >
              {dragActive && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {extracting ? (
                <div className="flex flex-col items-center gap-2 text-white/70">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm">Extracting text…</span>
                </div>
              ) : file ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div className="grid place-items-center h-10 w-10 rounded-lg bg-fuchsia-500/20">
                    <FileText className="h-5 w-5 text-fuchsia-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-white/50">
                      {resumeText.split(/\s+/).filter(Boolean).length} words extracted
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                      setResumeText("");
                    }}
                    className="ml-2 rounded-full p-1 hover:bg-white/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/60">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 border border-white/10"
                  >
                    <Upload className="h-5 w-5 text-white/80" />
                  </motion.div>
                  <div className="text-sm mt-2">
                    <span className="text-white font-medium">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-white/40">PDF, DOCX, or TXT</div>
                </div>
              )}
            </label>

            <details className="mt-4 group">
              <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70 select-none">
                Or paste resume text directly
              </summary>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume text here…"
                rows={6}
                className="mt-3 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-fuchsia-400/60"
              />
            </details>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="grid place-items-center h-6 w-6 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-bold">2</div>
              <h2 className="text-sm font-semibold text-white/80">
                Job description <span className="text-white/40 font-normal">(optional)</span>
              </h2>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job posting here for keyword match and targeted feedback…"
              rows={12}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-400/60"
            />
            <div className="mt-3 flex items-center justify-between text-xs text-white/40">
              <span>{jdText.split(/\s+/).filter(Boolean).length} words</span>
              {jdText && (
                <button onClick={() => setJdText("")} className="hover:text-white/70">Clear</button>
              )}
            </div>
          </motion.section>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <button
            onClick={analyze}
            disabled={analyzing || extracting || !resumeText.trim()}
            className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-indigo-500 py-4 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
          >
            <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Sparkles className="h-4 w-4" />
            {analyzing ? "Analyzing…" : "Analyze resume"}
            <ArrowRight className="h-4 w-4" />
          </button>
          {!env.ENABLE_AI && (
            <p className="mt-3 text-xs text-amber-300/80 text-center">
              AI suggestions are disabled in this environment ({env.APP_ENV}). Score + JD match still run.
            </p>
          )}
        </motion.div>

        {/* Recent history preview */}
        {history.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Recent activity</h2>
              <Link to="/history" className="text-xs text-white/60 hover:text-white inline-flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {history.slice(0, 3).map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="truncate text-sm">{h.fileName}</span>
                    </div>
                    <span className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {h.ats.total}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-white/40">{relativeTime(h.createdAt)}</div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${h.ats.total}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}

function StatTile({
  i, icon: Icon, label, value, suffix, accent, isText,
}: {
  i: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  suffix?: string;
  accent: string;
  isText?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + i * 0.05 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <div className={`absolute -top-10 -right-10 h-28 w-28 rounded-full blur-2xl bg-gradient-to-br ${accent}`} />
      <div className="relative flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-white/50">{label}</div>
        <Icon className="h-4 w-4 text-white/60" />
      </div>
      <div className="relative mt-3 flex items-baseline gap-1">
        <span
          className={`font-bold ${isText ? "text-xl" : "text-3xl"}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {value}
        </span>
        {suffix && <span className="text-xs text-white/40">{suffix}</span>}
      </div>
    </motion.div>
  );
}

function QuickAction({
  i, to, icon: Icon, title, desc, gradient,
}: {
  i: number;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + i * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Link
        to={to}
        className={`group relative block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-5 hover:border-white/20 transition`}
      >
        <div className="flex items-start justify-between">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-white/10 border border-white/10">
            <Icon className="h-5 w-5" />
          </div>
          <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition" />
        </div>
        <div className="mt-4 text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-white/60 leading-relaxed">{desc}</div>
      </Link>
    </motion.div>
  );
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}
