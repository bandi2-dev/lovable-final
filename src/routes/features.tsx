import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Target, Sparkles, Shield, Brain, Wand2, Rocket, FileText, Zap } from "lucide-react";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
  head: () => ({
    meta: [
      { title: "Features — Resume AI" },
      { name: "description", content: "Everything Resume AI does: ATS scoring, JD matching, AI rewrites, templates, and interview prep." },
      { property: "og:title", content: "Features — Resume AI" },
      { property: "og:description", content: "Explore every feature of the AI-powered resume analyzer." },
    ],
  }),
});

const groups = [
  {
    title: "Scoring & analysis",
    items: [
      { icon: BarChart3, title: "100-point ATS score", desc: "Weighted breakdown across 6 categories — contact, sections, length, formatting, impact, keywords." },
      { icon: Target, title: "JD match", desc: "Real-time keyword overlap, matched/gap lists, and section-level scoring." },
      { icon: Shield, title: "Privacy first", desc: "File extraction runs in-browser. Nothing leaves your machine unless you opt-in to Supabase history." },
    ],
  },
  {
    title: "AI coaching",
    items: [
      { icon: Sparkles, title: "Bullet rewrites", desc: "Mistral rewrites each bullet with strong verbs, quantified impact, and role-specific tone." },
      { icon: Brain, title: "Section feedback", desc: "Per-section critique for Experience, Skills, Education, and Projects." },
      { icon: Wand2, title: "Action items", desc: "Prioritized to-do list with the changes that move your score the most." },
    ],
  },
  {
    title: "Beyond the score",
    items: [
      { icon: FileText, title: "Templates library", desc: "Hand-crafted resume templates for FAANG, startups, consulting, and academia." },
      { icon: Rocket, title: "Interview prep", desc: "STAR-format answer bank generated from your resume + JD." },
      { icon: Zap, title: "Local & fast", desc: "Under 3s analysis. Fully offline mode when AI is disabled." },
    ],
  },
];

function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <h1 className="mt-8 text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Features that <span className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">actually ship interviews</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-white/60">A complete resume toolkit, built for engineers, PMs, and researchers.</p>

        <div className="mt-16 space-y-16">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300/80">{g.title}</div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                {g.items.map((it, i) => (
                  <motion.div key={it.title}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-white/20 transition">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 border border-white/10 grid place-items-center">
                      <it.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 font-semibold text-lg">{it.title}</h3>
                    <p className="mt-2 text-sm text-white/60 leading-relaxed">{it.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
