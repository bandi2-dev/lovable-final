import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FileText, Briefcase, Target, Zap, ArrowRight, CheckCircle2, Upload,
  BarChart3, Star, Shield, Rocket, Brain, Wand2, ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const session = useAuthStore((s) => s.session);
  const ctaTarget = session ? "/dashboard" : "/auth/signup";
  return (
    <div className="min-h-screen bg-[#05050a] text-white overflow-x-hidden selection:bg-fuchsia-500/30">
      <CursorGlow />
      <Nav session={!!session} />
      <Hero ctaTarget={ctaTarget} />
      <Stats />
      <Features />
      <InteractiveDemo />
      <HowItWorks />
      <SamplePreview />
      <Testimonials />
      <PricingTeaser />
      <FAQ />
      <Newsletter />
      <FinalCTA ctaTarget={ctaTarget} />
      <Footer />
    </div>
  );
}

/* ————————————————— Cursor Glow ————————————————— */
function CursorGlow() {
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const sx = useSpring(x, { stiffness: 150, damping: 20 });
  const sy = useSpring(y, { stiffness: 150, damping: 20 });
  useEffect(() => {
    const h = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [x, y]);
  return (
    <motion.div
      className="pointer-events-none fixed z-30 h-96 w-96 rounded-full blur-3xl opacity-30"
      style={{
        x: sx, y: sy, translateX: "-50%", translateY: "-50%",
        background: "radial-gradient(circle, rgba(217,70,239,0.35), transparent 60%)",
      }}
    />
  );
}

/* ————————————————— Nav ————————————————— */
function Nav({ session }: { session: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    h(); window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all ${scrolled ? "backdrop-blur-xl bg-[#05050a]/70 border-b border-white/10" : "bg-transparent"}`}>
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 via-rose-500 to-indigo-500 grid place-items-center shadow-lg shadow-fuchsia-500/30">
            <Briefcase className="h-4 w-4" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Resume AI</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/70">
          <Link to="/features" className="hover:text-white transition">Features</Link>
          <Link to="/templates" className="hover:text-white transition">Templates</Link>
          <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
          <Link to="/about" className="hover:text-white transition">About</Link>
          <Link to="/faq" className="hover:text-white transition">FAQ</Link>
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <Link to="/dashboard" className="text-sm px-4 py-2 rounded-full bg-white text-black font-medium hover:bg-white/90 transition">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/auth/login" className="text-sm text-white/80 hover:text-white transition">Sign in</Link>
              <MagneticButton>
                <Link to="/auth/signup" className="text-sm px-4 py-2 rounded-full bg-white text-black font-medium hover:bg-white/90 transition inline-block">
                  Get started
                </Link>
              </MagneticButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* ————————————————— Magnetic Button ————————————————— */
function MagneticButton({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    x.set((e.clientX - r.left - r.width / 2) * strength);
    y.set((e.clientY - r.top - r.height / 2) * strength);
  };
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}

/* ————————————————— Interactive Sphere ————————————————— */
function InteractiveSphere({
  className, delay = 0, parallax = 0.05,
}: { className: string; delay?: number; parallax?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX - window.innerWidth / 2) * parallax,
        y: (e.clientY - window.innerHeight / 2) * parallax,
      });
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [parallax]);
  return (
    <motion.div
      ref={ref}
      className={`absolute rounded-full blur-[100px] opacity-50 ${className}`}
      animate={{
        x: [0, 40, -30, 0],
        y: [0, -30, 40, 0],
        scale: [1, 1.08, 0.94, 1],
      }}
      transition={{ duration: 20, delay, repeat: Infinity, ease: "easeInOut" }}
      style={{ translateX: mouse.x, translateY: mouse.y }}
    />
  );
}

/* ————————————————— Hero ————————————————— */
function Hero({ ctaTarget }: { ctaTarget: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <InteractiveSphere className="left-[-6rem] top-24 h-[28rem] w-[28rem] bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400" delay={0} parallax={0.03} />
      <InteractiveSphere className="right-[-8rem] top-1/3 h-[32rem] w-[32rem] bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400" delay={2} parallax={0.04} />
      <InteractiveSphere className="left-1/3 bottom-[-6rem] h-[24rem] w-[24rem] bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-500" delay={4} parallax={0.02} />

      {/* Noise + grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <motion.div style={{ y, opacity }} className="relative z-10 mx-auto max-w-6xl px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Now powered by Mistral AI + Supabase
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.02]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Your resume, <br />
          <span className="bg-gradient-to-r from-fuchsia-400 via-rose-400 to-orange-300 bg-clip-text text-transparent">
            reviewed by AI
          </span>{" "}
          in seconds.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 mx-auto max-w-2xl text-lg text-white/70"
        >
          Instant ATS score, JD keyword match, AI rewrites, industry templates —
          everything you need to turn "applied" into "hired."
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <MagneticButton>
            <Link to={ctaTarget} className="group inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition">
              Analyze my resume <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </MagneticButton>
          <a href="#features" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 hover:bg-white/10 transition backdrop-blur">
            See how it works
          </a>
        </motion.div>

        <div className="mt-20 opacity-70"><Marquee /></div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-xs flex flex-col items-center gap-2"
      >
        Scroll <ChevronDown className="h-4 w-4" />
      </motion.div>
    </section>
  );
}

function Marquee() {
  const items = ["React", "TypeScript", "Node.js", "Python", "AWS", "Docker", "Kubernetes", "PostgreSQL", "Next.js", "GraphQL", "ML/AI", "System Design", "CI/CD"];
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      <motion.div className="flex gap-8 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        {[...items, ...items, ...items].map((it, i) => (
          <span key={i} className="text-white/50 text-sm font-medium">{it} •</span>
        ))}
      </motion.div>
    </div>
  );
}

/* ————————————————— Stats ————————————————— */
function Stats() {
  const stats = [
    { n: "12k+", l: "Resumes scored" },
    { n: "94%", l: "Interview lift" },
    { n: "<3s", l: "Analysis time" },
    { n: "100%", l: "Runs locally" },
  ];
  return (
    <section className="relative py-20 px-6 border-y border-white/5 bg-white/[0.015]">
      <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center"
          >
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.n}</div>
            <div className="mt-2 text-sm text-white/50">{s.l}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ————————————————— Features ————————————————— */
function Features() {
  const features = [
    { icon: BarChart3, title: "ATS Score", desc: "100-point breakdown across contact info, sections, length, formatting, impact & JD keywords." },
    { icon: Target, title: "JD Match", desc: "Paste any JD to see overlap %, matched skills and gaps in seconds." },
    { icon: Brain, title: "AI Rewrites", desc: "Mistral AI rewrites bullets and delivers section-by-section coaching." },
    { icon: FileText, title: "PDF & DOCX", desc: "Drag-and-drop. Text extraction runs in your browser — files never leave your machine." },
    { icon: Brain, title: "Smart Suggestions", desc: "Contextual, role-aware improvements — not generic templates." },
    { icon: Shield, title: "Private by design", desc: "Local auth. Optional Supabase for history. No tracking, ever." },
    { icon: Wand2, title: "Templates library", desc: "Battle-tested resume templates for FAANG, startups, and consulting." },
    { icon: Rocket, title: "Interview prep", desc: "Question banks and STAR examples tuned to your JD." },
  ];
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow="Features" title="Everything you need to land the interview." />
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur hover:border-white/20 transition overflow-hidden"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-fuchsia-500/10 via-transparent to-indigo-500/10" />
              <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 border border-white/10 grid place-items-center">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="relative mt-5 font-semibold text-lg">{f.title}</h3>
              <p className="relative mt-2 text-sm text-white/60 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Interactive Demo (3D tilt) ————————————————— */
function InteractiveDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 150, damping: 15 });
  const sry = useSpring(ry, { stiffness: 150, damping: 15 });
  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 15); rx.set(-py * 15);
  };
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow="Interactive" title="Hover the card. Move your mouse." />
        <div className="mt-14 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Real-time keyword heatmap
            </h3>
            <p className="mt-4 text-white/60 leading-relaxed">
              As you paste a job description, Resume AI highlights matches and gaps live.
              Powered by our JD-match engine and Mistral's semantic reasoning.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/70">
              {["Skill graph across 8k tokens", "Fuzzy stem-matching", "Weighted by section", "One-click bullet rewrite"].map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <motion.div
            ref={ref}
            onMouseMove={onMove}
            onMouseLeave={() => { rx.set(0); ry.set(0); }}
            style={{ rotateX: srx, rotateY: sry, transformPerspective: 1200 }}
            className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-3 text-xs text-white/40">resumate.app / analysis</span>
            </div>
            <div className="mt-4 grid grid-cols-6 gap-1.5">
              {Array.from({ length: 42 }).map((_, i) => {
                const state = i % 5 === 0 ? "match" : i % 7 === 0 ? "gap" : "neutral";
                const cls = state === "match" ? "bg-emerald-400/70" : state === "gap" ? "bg-rose-400/60" : "bg-white/10";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.01 }}
                    className={`h-8 rounded ${cls}`}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-white/50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400/80" /> Matches</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400/70" /> Gaps</span>
              </div>
              <span>Live JD sync</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ————————————————— How it works ————————————————— */
function HowItWorks() {
  const steps = [
    { icon: Upload, title: "Upload", desc: "Drop your PDF or DOCX resume, optionally paste the target JD." },
    { icon: Zap, title: "Analyze", desc: "We compute your ATS score and JD overlap instantly — offline, in your browser." },
    { icon: Brain, title: "Improve", desc: "Mistral AI generates rewrites, feedback and prioritized action items." },
  ];
  return (
    <section id="how" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
      <div className="mx-auto max-w-5xl">
        <SectionHeader eyebrow="How it works" title="From resume to interview-ready in three steps." />
        <div className="mt-16 relative">
          <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div key={s.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="relative text-center"
              >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 grid place-items-center shadow-2xl shadow-fuchsia-500/20">
                  <s.icon className="h-7 w-7 text-white" />
                </div>
                <div className="mt-2 text-xs font-semibold text-white/40">STEP {i + 1}</div>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-white/60 max-w-xs mx-auto">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Sample Score Preview ————————————————— */
function SamplePreview() {
  return (
    <section id="preview" className="relative py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeader eyebrow="Preview" title="A score card designed for clarity." />
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="mt-14 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 backdrop-blur-xl shadow-2xl"
        >
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="text-center">
              <div className="relative h-40 w-40 mx-auto">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <motion.circle cx="50" cy="50" r="42" stroke="url(#grad)" strokeWidth="8" fill="none" strokeLinecap="round"
                    initial={{ strokeDasharray: "0 264" }} whileInView={{ strokeDasharray: "224 264" }} viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: "easeOut" }} />
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div>
                    <div className="text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>85</div>
                    <div className="text-xs text-white/50">/ 100</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-white/60">ATS Score</div>
            </div>
            <div className="md:col-span-2 space-y-3">
              {[
                { label: "Contact info", val: 10, max: 10 },
                { label: "Sections", val: 22, max: 25 },
                { label: "Length", val: 10, max: 10 },
                { label: "Formatting", val: 15, max: 15 },
                { label: "Impact & verbs", val: 15, max: 20 },
                { label: "JD keywords", val: 13, max: 20 },
              ].map((c, i) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-white/70">{c.label}</span>
                    <span className="text-white/50 text-xs">{c.val}/{c.max}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-fuchsia-400 to-indigo-400"
                      initial={{ width: 0 }} whileInView={{ width: `${(c.val / c.max) * 100}%` }}
                      viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ————————————————— Testimonials ————————————————— */
function Testimonials() {
  const items = [
    { name: "Aditi R.", role: "SDE @ FAANG", text: "Went from 3% callback rate to 5 interviews in a week. The JD match view is gold." },
    { name: "Marco L.", role: "PM @ Startup", text: "The rewrites feel like a senior recruiter is sitting next to me. Wild for a free tool." },
    { name: "Priya S.", role: "MTech student", text: "Used it for placements — got shortlisted at 4 out of 6 companies." },
    { name: "Jordan K.", role: "Data Scientist", text: "Finally a resume tool that actually reads my PDF right. ATS breakdown is spot on." },
  ];
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow="Loved" title="Kind words from real users." />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur hover:border-white/20 transition"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, s) => <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-sm text-white/80 leading-relaxed">"{t.text}"</p>
              <div className="mt-4 text-xs">
                <div className="font-semibold text-white">{t.name}</div>
                <div className="text-white/50">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Pricing teaser ————————————————— */
function PricingTeaser() {
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-5xl text-center">
        <SectionHeader eyebrow="Pricing" title="Free forever. Pro when you're ready." />
        <div className="mt-14 grid md:grid-cols-2 gap-6">
          {[
            { name: "Free", price: "$0", perks: ["Unlimited ATS scans", "JD match", "3 AI rewrites / day", "Local storage"] },
            { name: "Pro", price: "$9", perks: ["Everything in Free", "Unlimited AI rewrites", "Templates library", "Interview prep bank", "Priority Mistral models"], highlight: true },
          ].map((p) => (
            <motion.div key={p.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`rounded-3xl border p-8 text-left backdrop-blur ${p.highlight ? "border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/10 to-indigo-500/10" : "border-white/10 bg-white/[0.03]"}`}
            >
              <div className="text-sm text-white/60">{p.name}</div>
              <div className="mt-1 text-4xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.price}<span className="text-base text-white/40 font-normal">/mo</span></div>
              <ul className="mt-6 space-y-2 text-sm text-white/70">
                {p.perks.map((x, i) => <li key={i} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> {x}</li>)}
              </ul>
              <Link to="/pricing" className={`mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${p.highlight ? "bg-white text-black hover:bg-white/90" : "border border-white/20 text-white/90 hover:bg-white/10"}`}>
                See details <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— FAQ ————————————————— */
function FAQ() {
  const faqs = [
    { q: "Is my resume data private?", a: "Yes. File parsing runs entirely in your browser. If you enable Supabase, only the score & metadata are stored — never the file itself." },
    { q: "Which file types are supported?", a: "PDF and DOCX. Text is extracted with pdfjs-dist and mammoth, locally." },
    { q: "Do I need an API key?", a: "Only for AI rewrites. Add a free Mistral key to .env.local and you're set." },
    { q: "Can I self-host?", a: "Yes — Dockerfile and full Kubernetes manifests are included." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeader eyebrow="FAQ" title="Questions, answered." />
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
                    <div className="px-6 pb-5 text-sm text-white/60">{f.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ————————————————— Newsletter (Supabase) ————————————————— */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.from("subscribers").insert({ email });
        if (error) throw error;
        toast.success("You're on the list.");
      } else {
        toast.success("Thanks! (Supabase not configured — saved locally.)");
      }
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setLoading(false); }
  };
  return (
    <section className="relative py-24 px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-white/[0.02] to-indigo-500/10 p-10 text-center backdrop-blur-xl">
        <h3 className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Get product updates</h3>
        <p className="mt-2 text-sm text-white/60">Occasional emails. No spam. Unsubscribe anytime.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@example.com"
            className="flex-1 rounded-full border border-white/15 bg-black/40 px-5 py-3 text-sm outline-none focus:border-white/40" />
          <button disabled={loading} className="rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-white/90 transition disabled:opacity-50">
            {loading ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}

function FinalCTA({ ctaTarget }: { ctaTarget: string }) {
  return (
    <section className="relative py-32 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-4xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Ready to see your score?
        </motion.h2>
        <p className="mt-4 text-white/60">Free, private, and lightning fast.</p>
        <div className="mt-8 flex items-center justify-center gap-3 text-sm text-white/60">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No signup fees
          <span className="mx-2">•</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Runs locally
        </div>
        <div className="mt-8">
          <MagneticButton>
            <Link to={ctaTarget} className="group inline-flex items-center gap-2 rounded-full bg-white text-black px-8 py-4 text-base font-semibold hover:bg-white/90 transition">
              Get started free <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6 text-center text-xs text-white/40">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>Resume AI • Built with TanStack Start + Mistral AI + Supabase • MTech Major Project</div>
        <div className="flex gap-4">
          <Link to="/features" className="hover:text-white/70">Features</Link>
          <Link to="/pricing" className="hover:text-white/70">Pricing</Link>
          <Link to="/templates" className="hover:text-white/70">Templates</Link>
          <Link to="/about" className="hover:text-white/70">About</Link>
          <Link to="/faq" className="hover:text-white/70">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <div className="inline-block text-xs font-semibold uppercase tracking-widest text-fuchsia-300/80">{eyebrow}</div>
      <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h2>
    </div>
  );
}
