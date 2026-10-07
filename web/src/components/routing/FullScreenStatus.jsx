import { LoaderCircle, WifiOff } from 'lucide-react';
import { LogoMark } from '../brand/Logo.jsx';
import { Button } from '../ui/Button.jsx';

export function FullScreenLoader({ label = 'Loading' }) {
  return (
    <div className="app-backdrop flex min-h-dvh flex-col items-center justify-center gap-5" role="status">
      <LogoMark className="size-12 animate-pulse" />
      <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}

export function FullScreenUnreachable({ onRetry, onSignOut }) {
  return (
    <div className="app-backdrop flex min-h-dvh items-center justify-center p-6">
      <div role="alert" className="glass w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-400/20">
          <WifiOff className="size-5 text-amber-300" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-50">Can’t reach Orbit right now</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We couldn’t verify your session because the server is unreachable. Check your connection and try
          again.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={onRetry}>Try again</Button>
          <Button variant="ghost" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
