import { Search, X } from 'lucide-react';

export function SearchInput({ value, onChange, label, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        maxLength={100}
        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-9 pl-10 text-sm text-zinc-100 placeholder:text-zinc-500 transition-colors hover:border-white/20 focus:border-indigo-400/70 focus:ring-4 focus:ring-indigo-400/15 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:text-zinc-100"
          aria-label="Clear search"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
