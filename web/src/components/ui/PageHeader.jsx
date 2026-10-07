export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-medium tracking-[0.18em] text-indigo-300/80 uppercase">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
