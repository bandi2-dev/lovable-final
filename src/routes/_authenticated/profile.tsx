import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { User, Calendar, Award, TrendingUp, Flame, FileText } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useUserHistory } from "@/lib/analysis-store";
import { FloatingOrbs } from "@/components/FloatingOrbs";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const session = useAuthStore((s) => s.session);
  const history = useUserHistory();

  const stats = useMemo(() => {
    if (history.length === 0) {
      return { count: 0, avg: 0, best: 0, latest: 0, delta: 0, streak: 0 };
    }
    const scores = history.map((h) => h.ats.total);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    const latest = history[0].ats.total;
    const previous = history[1]?.ats.total ?? latest;
    const delta = latest - previous;

    // streak of days
    const days = new Set(history.map((h) => new Date(h.createdAt).toDateString()));
    let streak = 0;
    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) streak++;
      else break;
    }

    return { count: history.length, avg, best, latest, delta, streak };
  }, [history]);

  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .map((h, i) => ({
          idx: i + 1,
          score: h.ats.total,
          label: new Date(h.createdAt).toLocaleDateString(),
        })),
    [history],
  );

  const initials = (session?.name ?? "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <FloatingOrbs />
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-indigo-500/10 p-8 backdrop-blur-xl"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], rotate: [0, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl"
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 12 }}
              className="grid place-items-center h-20 w-20 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-2xl font-bold shadow-lg shadow-fuchsia-500/30"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {initials || <User className="h-8 w-8" />}
            </motion.div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                <User className="h-3.5 w-3.5" /> Profile
              </div>
              <h1 className="mt-1 text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {session?.name}
              </h1>
              <div className="mt-1 text-sm text-white/60">{session?.email}</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge icon={Calendar}>
                  Joined {session ? new Date(session.issuedAt).toLocaleDateString() : "—"}
                </Badge>
                <Badge icon={Flame}>{stats.streak}-day streak</Badge>
                <Badge icon={FileText}>{stats.count} analyses</Badge>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stat grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard i={0} icon={TrendingUp} label="Latest score" value={stats.latest} delta={stats.delta} />
          <StatCard i={1} icon={Award} label="Best score" value={stats.best} />
          <StatCard i={2} icon={FileText} label="Average score" value={stats.avg} />
          <StatCard i={3} icon={Flame} label="Day streak" value={stats.streak} noMax />
        </div>

        {/* Trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/80">ATS score over time</h2>
            <span className="text-xs text-white/40">{chartData.length} data points</span>
          </div>
          {chartData.length === 0 ? (
            <div className="h-64 grid place-items-center text-sm text-white/40">
              Analyze a few resumes to see your growth curve.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="idx" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#0a0a0f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(l, p) => (p[0] as any)?.payload?.label ?? l}
                  />
                  <Area type="monotone" dataKey="score" stroke="#a78bfa" strokeWidth={2} fill="url(#scoreArea)" />
                  <Line type="monotone" dataKey="score" stroke="#f472b6" strokeWidth={2} dot={{ r: 3, fill: "#f472b6" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6 grid gap-4 md:grid-cols-3"
        >
          {TIPS.map((t, i) => (
            <motion.div
              key={t.title}
              whileHover={{ y: -3 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
            >
              <div className="text-lg">{t.emoji}</div>
              <div className="mt-2 text-sm font-semibold">{t.title}</div>
              <div className="mt-1 text-xs text-white/60 leading-relaxed">{t.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

const TIPS = [
  { emoji: "🎯", title: "Tailor per role", desc: "Adjust keywords and highlights to match each specific job description." },
  { emoji: "📏", title: "Quantify impact", desc: "Numbers stand out. Add %, $, or counts to at least half of your bullets." },
  { emoji: "✂️", title: "Trim ruthlessly", desc: "One page for <5 years experience. Two pages max. Every word must earn its spot." },
];

function Badge({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-white/70">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

function StatCard({
  i, icon: Icon, label, value, delta, noMax,
}: {
  i: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  delta?: number;
  noMax?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + i * 0.05 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-white/50">{label}</div>
        <Icon className="h-4 w-4 text-white/60" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</span>
        {!noMax && <span className="text-xs text-white/40">/100</span>}
        {delta !== undefined && delta !== 0 && (
          <span className={`text-xs font-medium ${delta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {delta > 0 ? "+" : ""}{delta}
          </span>
        )}
      </div>
    </motion.div>
  );
}
