import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Download } from "lucide-react";

export const Route = createFileRoute("/templates")({
  component: TemplatesPage,
  head: () => ({
    meta: [
      { title: "Templates — ResuMate" },
      { name: "description", content: "Battle-tested resume templates for FAANG, startups, consulting, and academia." },
      { property: "og:title", content: "Templates — ResuMate" },
    ],
  }),
});

const templates = [
  { name: "FAANG Engineer", tag: "Best for SDE II+", color: "from-fuchsia-500 to-rose-500", accent: "bg-fuchsia-500/20" },
  { name: "Startup Generalist", tag: "Founding engineer / PM", color: "from-indigo-500 to-blue-500", accent: "bg-indigo-500/20" },
  { name: "Consulting", tag: "MBB / Big 4", color: "from-emerald-500 to-teal-500", accent: "bg-emerald-500/20" },
  { name: "Data Scientist", tag: "ML / Research", color: "from-amber-500 to-orange-500", accent: "bg-amber-500/20" },
  { name: "Academic CV", tag: "PhD / postdoc", color: "from-violet-500 to-purple-500", accent: "bg-violet-500/20" },
  { name: "Product Manager", tag: "APM → Senior", color: "from-cyan-500 to-sky-500", accent: "bg-cyan-500/20" },
];

function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <div className="mt-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Resume <span className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">templates</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-white/60">ATS-friendly. Recruiter-tested. Editable in Google Docs or Word.</p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 transition"
            >
              <div className={`h-48 bg-gradient-to-br ${t.color} relative overflow-hidden`}>
                <div className="absolute inset-4 rounded-lg bg-white/95 p-3 shadow-2xl">
                  <div className="h-2 w-1/2 rounded bg-slate-800 mb-2" />
                  <div className="h-1.5 w-1/3 rounded bg-slate-400 mb-3" />
                  <div className="space-y-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-1 rounded bg-slate-200" style={{ width: `${60 + Math.random() * 40}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-xs text-white/50">{t.tag}</p>
                  </div>
                  <button className={`inline-flex items-center gap-1.5 rounded-full ${t.accent} border border-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/10 transition`}>
                    <Download className="h-3.5 w-3.5" /> Get
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
