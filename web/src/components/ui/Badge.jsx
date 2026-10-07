import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/constants.js';

const toneClasses = {
  neutral: 'bg-zinc-400/10 text-zinc-300 ring-zinc-400/20',
  info: 'bg-indigo-400/10 text-indigo-200 ring-indigo-400/25',
  success: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  warning: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  danger: 'bg-rose-400/10 text-rose-300 ring-rose-400/25',
};

const statusTones = {
  NOT_STARTED: 'neutral',
  PENDING: 'neutral',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
};

const priorityTones = { LOW: 'neutral', MEDIUM: 'warning', HIGH: 'danger' };

export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge tone={statusTones[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PriorityBadge({ priority }) {
  return <Badge tone={priorityTones[priority]}>{PRIORITY_LABELS[priority]} priority</Badge>;
}
