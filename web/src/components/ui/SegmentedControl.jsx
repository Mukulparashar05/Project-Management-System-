import { motion } from 'framer-motion';
import { useId } from 'react';

export function SegmentedControl({ label, options, value, onChange }) {
  const indicatorId = useId();
  return (
    <div
      role="group"
      aria-label={label}
      className="surface inline-flex max-w-full gap-1 overflow-x-auto rounded-xl p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`relative h-8 shrink-0 rounded-lg px-3 text-xs font-medium transition-colors ${
              selected ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {selected && (
              <motion.span
                layoutId={indicatorId}
                className="absolute inset-0 rounded-lg bg-white/[0.09] ring-1 ring-white/10"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
