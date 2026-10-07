import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';

const controlBase =
  'block w-full rounded-xl border bg-white/[0.03] text-sm text-zinc-100 placeholder:text-zinc-500 transition-[border-color,box-shadow,background-color] duration-150 focus:bg-white/[0.05] focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60';

function controlState(error) {
  return error
    ? 'border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/15'
    : 'border-white/10 hover:border-white/20 focus:border-indigo-400/70 focus:ring-indigo-400/15';
}

function describedBy(id, error, hint) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

function FieldShell({ id, label, hint, error, optional, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between gap-2 text-sm font-medium text-zinc-200">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-zinc-500">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextField({ label, error, hint, optional, className = '', ...inputProps }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${controlBase} ${controlState(error)} h-11 px-3.5 ${className}`}
        {...inputProps}
      />
    </FieldShell>
  );
}

export function PasswordField({ label, error, hint, ...inputProps }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${controlBase} ${controlState(error)} h-11 pr-11 pl-3.5`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-zinc-400 transition-colors hover:text-zinc-100"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-controls={id}
        >
          <ToggleIcon className="size-4" aria-hidden="true" />
        </button>
      </div>
    </FieldShell>
  );
}

export function TextAreaField({ label, error, hint, optional, rows = 4, ...textareaProps }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${controlBase} ${controlState(error)} resize-y px-3.5 py-2.5 leading-relaxed`}
        {...textareaProps}
      />
    </FieldShell>
  );
}

export function SelectField({ label, error, hint, options, ...selectProps }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${controlBase} ${controlState(error)} h-11 appearance-none pr-10 pl-3.5`}
          {...selectProps}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-zinc-500"
          aria-hidden="true"
        />
      </div>
    </FieldShell>
  );
}

/** Compact select used in toolbars and inline task controls (label is visually hidden). */
export function InlineSelect({
  label,
  options,
  size = 'sm',
  className = '',
  toneClass = 'border-white/10 bg-white/[0.03] text-zinc-200',
  ...selectProps
}) {
  const heightClass = size === 'md' ? 'h-10 rounded-xl' : 'h-9 rounded-lg';
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={label}
        className={`${heightClass} w-full appearance-none border pr-8 pl-3 text-xs font-medium transition-colors hover:border-white/25 focus:border-indigo-400/70 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
    </div>
  );
}
