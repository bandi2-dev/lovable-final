import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQ — Resume AI" },
      { name: "description", content: "Frequently asked questions about Resume AI." },
      { property: "og:title", content: "FAQ — Resume AI" },
    ],
  }),
});

const faqs = [
  { q: "Is my resume data private?", a: "Yes. File parsing runs entirely in your browser. Only score & metadata (if you opt-in) are synced to Supabase — never the file itself." },
  { q: "Which file types are supported?", a: "PDF and DOCX. Text extraction uses pdfjs-dist and mammoth, both browser-native." },
  { q: "Do I need an API key?", a: "Only if you want AI rewrites. Grab a free Mistral key at console.mistral.ai and paste it into .env.local." },
  { q: "Can I self-host?", a: "Yes — production Dockerfile and full Kubernetes manifests (base + local/dev/test/prod overlays) are included." },
  { q: "How is the ATS score computed?", a: "A transparent 100-point rubric across contact info, sections, length, formatting, impact verbs, and JD keyword overlap. Full source in src/lib/resume/ats.ts." },
  { q: "Which environments are supported?", a: "local, dev, test, and prod — each with its own .env file, kustomize overlay, and /api/config endpoint." },
  { q: "Is there a mobile app?", a: "Not yet — but the web app is fully responsive down to 360px." },
  { q: "How do I contribute?", a: "This is an open MTech project. Fork it, break it, PR it." },
];

function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <h1 className="mt-8 text-5xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Frequently asked <span className="bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">questions</span>.
        </h1>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-6 pb-5 text-sm text-white/60 leading-relaxed">{f.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
