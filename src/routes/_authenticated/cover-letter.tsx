import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Wand2, Copy, Download, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useUserCurrent } from "@/lib/analysis-store";
import { useAuthStore } from "@/lib/auth-store";
import { env, aiEnabled, hasMistralKey } from "@/lib/env";
import { FloatingOrbs } from "@/components/FloatingOrbs";

export const Route = createFileRoute("/_authenticated/cover-letter")({
  component: CoverLetterPage,
});

const TONES = ["Professional", "Enthusiastic", "Confident", "Concise"] as const;

function CoverLetterPage() {
  const current = useUserCurrent();
  const session = useAuthStore((s) => s.session);
  const [resumeText, setResumeText] = useState(current?.resumeText ?? "");
  const [jdText, setJdText] = useState(current?.jdText ?? "");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [loading, setLoading] = useState(false);
  const [letter, setLetter] = useState("");

  async function generate() {
    if (!resumeText.trim()) {
      toast.error("Add your resume text first");
      return;
    }
    setLoading(true);
    setLetter("");
    try {
      if (!aiEnabled) {
        setLetter(fallbackLetter({ name: session?.name ?? "Candidate", company, role, tone }));
        toast.message(hasMistralKey ? "AI disabled — showing a template." : "Add VITE_MISTRAL_API_KEY to enable AI.");
        return;
      }
      const { Mistral } = await import("@mistralai/mistralai");
      const client = new Mistral({ apiKey: env.MISTRAL_API_KEY });
      const resp = await client.chat.complete({
        model: env.MISTRAL_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert career coach. Write a compelling, personalized cover letter using ONLY facts from the resume provided. Do not invent experience. Keep it to 3-4 short paragraphs, ~300 words. Return plain text only, no markdown, no preamble.",
          },
          {
            role: "user",
            content: `CANDIDATE NAME: ${session?.name ?? "Candidate"}
COMPANY: ${company || "(not specified)"}
ROLE: ${role || "(not specified)"}
TONE: ${tone}

RESUME:
${resumeText.slice(0, 6000)}

JOB DESCRIPTION:
${jdText.slice(0, 3000) || "(not provided)"}`,
          },
        ],
      });
      const raw = resp.choices?.[0]?.message?.content;
      const text =
        typeof raw === "string"
          ? raw
          : Array.isArray(raw)
          ? raw.map((p) => ("text" in p ? p.text : "")).join("")
          : "";
      setLetter(text.trim() || fallbackLetter({ name: session?.name ?? "Candidate", company, role, tone }));
      toast.success("Cover letter generated");
    } catch (e) {
      toast.error(`AI failed: ${e instanceof Error ? e.message : "unknown"}`);
      setLetter(fallbackLetter({ name: session?.name ?? "Candidate", company, role, tone }));
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(letter);
    toast.success("Copied to clipboard");
  }
  function download() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${company || "draft"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative">
      <FloatingOrbs />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
            <Wand2 className="h-3.5 w-3.5" /> AI Cover Letter
          </div>
          <h1 className="mt-2 text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Craft a cover letter in seconds
          </h1>
          <p className="mt-1 text-white/60">
            Tailored from your resume and the job description, powered by Mistral AI.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          {/* Left: form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-400/60"
              />
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-1 mt-4">Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Frontend Engineer"
                className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-400/60"
              />
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 mt-4">Tone</label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`text-xs rounded-full border px-3 py-1.5 transition ${
                      tone === t
                        ? "border-fuchsia-400 bg-fuchsia-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <summary className="text-xs uppercase tracking-widest text-white/50 cursor-pointer">
                Resume text {current && <span className="normal-case text-white/40 tracking-normal">(loaded from last analysis)</span>}
              </summary>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={6}
                placeholder="Paste resume text…"
                className="mt-3 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-xs font-mono text-white/80 focus:outline-none"
              />
            </details>

            <details className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
              <summary className="text-xs uppercase tracking-widest text-white/50 cursor-pointer">Job description</summary>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={6}
                placeholder="Paste JD…"
                className="mt-3 w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-xs font-mono text-white/80 focus:outline-none"
              />
            </details>

            <button
              onClick={generate}
              disabled={loading || !resumeText.trim()}
              className="group relative w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-500 to-indigo-500 py-3.5 text-sm font-semibold text-white hover:opacity-95 transition disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {loading ? "Writing…" : "Generate cover letter"}
            </button>
          </motion.div>

          {/* Right: output */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-xl min-h-[520px] relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-white/50">
                <FileText className="h-3.5 w-3.5" /> Draft
              </div>
              {letter && (
                <div className="flex items-center gap-2">
                  <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                  <button onClick={download} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
              )}
            </div>
            {loading ? (
              <SkeletonLetter />
            ) : letter ? (
              <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-pre-wrap text-sm leading-relaxed text-white/85 font-sans"
              >
                {letter}
              </motion.pre>
            ) : (
              <div className="text-sm text-white/40 h-full grid place-items-center min-h-[400px] text-center">
                <div>
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="mx-auto grid place-items-center h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 border border-white/10 mb-4"
                  >
                    <Wand2 className="h-6 w-6 text-white/70" />
                  </motion.div>
                  Fill in the fields and hit generate.
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SkeletonLetter() {
  return (
    <div className="space-y-3">
      {[90, 78, 84, 60, 95, 72, 88, 65].map((w, i) => (
        <motion.div
          key={i}
          className="h-3 rounded bg-white/10"
          style={{ width: `${w}%` }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
        />
      ))}
    </div>
  );
}

function fallbackLetter({
  name, company, role, tone,
}: { name: string; company: string; role: string; tone: string }): string {
  return `Dear Hiring Manager,

I'm writing to express my strong interest in the ${role || "role"} at ${company || "your company"}. With a background rooted in solving real problems and shipping thoughtful software, I believe my experience aligns closely with what your team is looking for.

Throughout my career, I've focused on measurable impact — reducing latency, mentoring teammates, and building products that people actually use. I would bring that same ${tone.toLowerCase()} approach to ${company || "your team"}.

I would love the opportunity to discuss how I can contribute. Thank you for your time and consideration.

Warm regards,
${name}`;
}
