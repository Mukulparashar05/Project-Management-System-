import { LoaderCircle } from 'lucide-react';
import { Link } from 'react-router';

const variantClasses = {
  primary:
    'bg-zinc-50 text-ink-950 shadow-[0_10px_30px_-12px_rgb(165_180_252/0.55)] hover:bg-white focus-visible:outline-indigo-300',
  secondary: 'surface text-zinc-100 hover:bg-white/[0.07]',
  ghost: 'text-zinc-300 hover:bg-white/[0.06] hover:text-white',
  danger: 'bg-rose-500 text-white hover:bg-rose-400',
};

const sizeClasses = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-sm',
};

function buttonClasses(variant, size, className) {
  return `inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  type = 'button',
  className = '',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export function ButtonLink({ to, variant = 'primary', size = 'md', icon: Icon, className = '', children }) {
  return (
    <Link to={to} className={buttonClasses(variant, size, className)}>
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </Link>
  );
}

export function IconButton({ icon: Icon, label, className = '', tone = 'default', ...props }) {
  const toneClass =
    tone === 'danger'
      ? 'hover:bg-rose-500/10 hover:text-rose-300'
      : 'hover:bg-white/[0.07] hover:text-zinc-100';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`}
      {...props}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
