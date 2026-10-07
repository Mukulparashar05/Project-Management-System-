import { motion } from 'framer-motion';
import { AnimatedNumber } from '../ui/AnimatedNumber.jsx';

const tones = {
  indigo: { glow: 'bg-indigo-500/25', icon: 'bg-indigo-500/10 text-indigo-300 ring-indigo-400/20' },
  sky: { glow: 'bg-sky-500/20', icon: 'bg-sky-500/10 text-sky-300 ring-sky-400/20' },
  emerald: { glow: 'bg-emerald-500/20', icon: 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20' },
  amber: { glow: 'bg-amber-500/20', icon: 'bg-amber-500/10 text-amber-300 ring-amber-400/20' },
  violet: { glow: 'bg-violet-500/25', icon: 'bg-violet-500/10 text-violet-300 ring-violet-400/20' },
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'indigo', index = 0 }) {
  const styles = tones[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      role="group"
      aria-label={label}
      className="glass group relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className={`pointer-events-none absolute -top-14 -right-14 size-36 rounded-full blur-3xl transition-opacity duration-500 ${styles.glow} opacity-50 group-hover:opacity-90`}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm text-zinc-400">{label}</p>
        <span className={`flex size-8 items-center justify-center rounded-lg ring-1 ${styles.icon}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="relative mt-5 text-[2rem] leading-none font-semibold tracking-tight text-zinc-50">
        <AnimatedNumber value={value} />
      </p>
      {hint && <p className="relative mt-2 text-xs text-zinc-500">{hint}</p>}
    </motion.div>
  );
}
