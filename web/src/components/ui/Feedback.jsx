import { CircleAlert, CircleCheck, Info, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from './Button.jsx';

export function Spinner({ label = 'Loading', className = '' }) {
  return (
    <span role="status" className={`inline-flex items-center gap-2 text-sm text-zinc-400 ${className}`}>
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

const alertStyles = {
  error: { icon: CircleAlert, className: 'border-rose-400/25 bg-rose-500/[0.08] text-rose-200' },
  warning: { icon: TriangleAlert, className: 'border-amber-400/25 bg-amber-500/[0.08] text-amber-100' },
  info: { icon: Info, className: 'border-indigo-400/25 bg-indigo-500/[0.08] text-indigo-100' },
  success: { icon: CircleCheck, className: 'border-emerald-400/25 bg-emerald-500/[0.08] text-emerald-100' },
};

export function Alert({ tone = 'error', children, className = '' }) {
  const { icon: Icon, className: toneClass } = alertStyles[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${toneClass} ${className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
          <Icon className="size-5 text-zinc-300" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-zinc-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className = '' }) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center rounded-2xl border border-rose-400/15 bg-rose-500/[0.04] px-6 py-12 text-center ${className}`}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-400/20">
        <CircleAlert className="size-5 text-rose-300" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      {message && <p className="mt-1.5 max-w-sm text-sm text-zinc-400">{message}</p>}
      {onRetry && (
        <Button variant="secondary" icon={RefreshCw} onClick={onRetry} className="mt-6">
          Try again
        </Button>
      )}
    </div>
  );
}
