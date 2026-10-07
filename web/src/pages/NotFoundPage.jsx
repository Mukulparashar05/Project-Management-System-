import { Compass } from 'lucide-react';
import { Link } from 'react-router';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <main className="app-backdrop flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/10">
        <Compass className="size-6 text-indigo-300" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium tracking-[0.18em] text-indigo-300/80 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">This page drifted out of orbit</h1>
      <p className="mt-3 max-w-md text-zinc-400">The page you’re looking for doesn’t exist or has moved.</p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex h-10 items-center rounded-xl bg-zinc-50 px-4 text-sm font-medium text-ink-950 transition-colors hover:bg-white"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
