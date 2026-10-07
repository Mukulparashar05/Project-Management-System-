import { motion } from 'framer-motion';

export function ProgressBar({ value, label, className = '' }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className={`h-1.5 overflow-hidden rounded-full bg-white/[0.06] ${className}`}
    >
      <motion.div
        className="h-full rounded-full bg-linear-to-r from-indigo-400 via-violet-400 to-cyan-300"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
