import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Pricing — Resume AI" },
      { name: "description", content: "Free forever plan. Pro plan for unlimited AI rewrites and templates." },
      { property: "og:title", content: "Pricing — Resume AI" },
    ],
  }),
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    tag: "For every job seeker",
    perks: ["Unlimited ATS scans", "JD keyword match", "3 AI rewrites / day", "PDF & DOCX upload", "Local storage"],
  },
  {
    name: "Pro",
    price: "$9",
    tag: "For active applicants",
    highlight: true,
    perks: ["Everything in Free", "Unlimited AI rewrites", "Templates library", "Interview prep bank", "Priority Mistral models", "Supabase history sync"],
  },
  {
    name: "Team",
    price: "$29",
    tag: "For career centers",
    perks: ["Everything in Pro", "5 seats included", "Bulk resume review", "Analytics dashboard", "SSO"],
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <div className="mt-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Simple, honest <span className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">pricing</span>.
          </h1>
          <p className="mt-4 text-white/60">Start free. Upgrade only if you love it.</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className={`relative rounded-3xl border p-8 backdrop-blur ${t.highlight ? "border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/10 scale-[1.02]" : "border-white/10 bg-white/[0.03]"}`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Most popular
                </div>
              )}
              <div className="text-sm text-white/60">{t.name}</div>
              <div className="mt-1 text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t.price}<span className="text-base text-white/40 font-normal">/mo</span>
              </div>
              <div className="text-xs text-white/50 mt-1">{t.tag}</div>
              <ul className="mt-6 space-y-2 text-sm text-white/70">
                {t.perks.map((p, j) => <li key={j} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {p}</li>)}
              </ul>
              <Link to="/auth/signup" className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${t.highlight ? "bg-white text-black hover:bg-white/90" : "border border-white/20 text-white/90 hover:bg-white/10"}`}>
                <Sparkles className="h-4 w-4" /> Start with {t.name}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
