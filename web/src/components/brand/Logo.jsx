import { useId } from 'react';

export function LogoMark({ className = 'size-8' }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5b4fc" />
          <stop offset="1" stopColor="#67e8f9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0e1118" />
      <rect x="0.5" y="0.5" width="63" height="63" rx="15.5" stroke="white" strokeOpacity="0.1" />
      <circle cx="32" cy="32" r="9" fill={`url(#${gradientId})`} />
      <ellipse
        cx="32"
        cy="32"
        rx="22"
        ry="9"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="3"
        transform="rotate(-28 32 32)"
      />
      <circle cx="51" cy="22" r="3.5" fill="#67e8f9" />
    </svg>
  );
}

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="size-8" />
      <span className="text-[1.05rem] font-semibold tracking-tight text-zinc-50">Orbit</span>
    </span>
  );
}
