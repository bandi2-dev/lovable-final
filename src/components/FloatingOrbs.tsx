import { motion } from "framer-motion";

interface OrbConfig {
  size: number;
  top: string;
  left: string;
  from: string;
  to: string;
  duration: number;
  delay?: number;
}

const DEFAULT_ORBS: OrbConfig[] = [
  { size: 420, top: "-8%", left: "-6%", from: "#a855f7", to: "#ec4899", duration: 18 },
  { size: 360, top: "35%", left: "78%", from: "#6366f1", to: "#22d3ee", duration: 22, delay: 2 },
  { size: 300, top: "72%", left: "12%", from: "#f472b6", to: "#818cf8", duration: 20, delay: 4 },
];

export function FloatingOrbs({ orbs = DEFAULT_ORBS }: { orbs?: OrbConfig[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-30"
          style={{
            width: o.size,
            height: o.size,
            top: o.top,
            left: o.left,
            background: `radial-gradient(circle at 30% 30%, ${o.from}, ${o.to} 70%, transparent 100%)`,
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.12, 0.95, 1],
          }}
          transition={{
            duration: o.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: o.delay ?? 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04),transparent_60%)]" />
    </div>
  );
}
