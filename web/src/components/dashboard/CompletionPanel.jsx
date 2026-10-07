import { motion } from 'framer-motion';
import { AnimatedNumber } from '../ui/AnimatedNumber.jsx';

const segments = [
  { key: 'COMPLETED', label: 'Completed', className: 'bg-emerald-400' },
  { key: 'IN_PROGRESS', label: 'In progress', className: 'bg-indigo-400' },
  { key: 'PENDING', label: 'Pending', className: 'bg-zinc-500' },
];

export function CompletionPanel({ completionRate, tasksByStatus, totalTasks }) {
  const summary = segments.map(({ key, label }) => `${tasksByStatus[key]} ${label.toLowerCase()}`).join(', ');

  return (
    <section className="glass rounded-2xl p-6" aria-labelledby="completion-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="completion-heading" className="text-sm font-medium text-zinc-300">
            Task completion
          </h2>
          <p className="mt-1 text-xs text-zinc-500">Across all of your projects</p>
        </div>
        <p className="text-4xl font-semibold tracking-tight text-zinc-50">
          <AnimatedNumber value={completionRate} />
          <span className="text-2xl text-zinc-500">%</span>
        </p>
      </div>

      <div
        className="mt-6 flex h-3 gap-1 overflow-hidden rounded-full bg-white/[0.05]"
        role="img"
        aria-label={totalTasks === 0 ? 'No tasks yet' : `Tasks: ${summary}`}
      >
        {totalTasks > 0 &&
          segments.map(({ key, className }, index) =>
            tasksByStatus[key] > 0 ? (
              <motion.div
                key={key}
                className={`h-full rounded-full ${className}`}
                initial={{ width: 0 }}
                animate={{ width: `${(tasksByStatus[key] / totalTasks) * 100}%` }}
                transition={{ duration: 0.9, delay: 0.1 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              />
            ) : null,
          )}
      </div>

      <ul className="mt-5 grid grid-cols-3 gap-3">
        {segments.map(({ key, label, className }) => (
          <li key={key} className="rounded-xl bg-white/[0.025] px-3 py-2.5 ring-1 ring-white/[0.05]">
            <p className="flex items-center gap-2 text-xs text-zinc-400">
              <span className={`size-2 rounded-full ${className}`} aria-hidden="true" />
              {label}
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-100 tabular-nums">{tasksByStatus[key]}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
