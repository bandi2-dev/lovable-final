import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Github, Twitter, Mail } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Resume AI" },
      { name: "description", content: "Resume AI is an MTech major project — an open, local-first AI resume analyzer." },
      { property: "og:title", content: "About — Resume AI" },
    ],
  }),
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="mt-10 text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Built for <span className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">the applicant</span>, not the recruiter.
        </motion.h1>
        <div className="mt-10 space-y-6 text-white/70 leading-relaxed">
          <p>
            Resume AI started as an MTech major project — an experiment in what a modern,
            local-first resume tool could look like when you strip out the tracking,
            the paywalls, and the black-box "AI magic".
          </p>
          <p>
            Every file you upload is parsed in your browser. Your ATS score is computed
            with a fully transparent 100-point rubric you can read in <code className="text-fuchsia-300">src/lib/resume/ats.ts</code>.
            When you ask for AI rewrites, we talk to Mistral directly with your key — no middlemen.
          </p>
          <p>
            The stack is deliberately boring: TanStack Start, React 19, Tailwind v4, Supabase,
            Mistral. All open, all inspectable, all yours to fork.
          </p>
        </div>

        <div className="mt-14 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-xl font-semibold">The stack</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {["TanStack Start", "React 19", "TypeScript", "Tailwind v4", "Framer Motion", "Mistral AI", "Supabase", "Zustand", "pdfjs-dist", "mammoth", "Docker", "Kubernetes"].map((s) => (
              <div key={s} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white/70">{s}</div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <a href="https://github.com" className="rounded-full border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"><Github className="h-4 w-4" /></a>
          <a href="https://twitter.com" className="rounded-full border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"><Twitter className="h-4 w-4" /></a>
          <a href="mailto:hello@resumate.app" className="rounded-full border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"><Mail className="h-4 w-4" /></a>
        </div>
      </div>
    </div>
  );
}
