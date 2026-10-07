import { motion } from 'framer-motion';
import { Logo } from '../components/brand/Logo.jsx';
import { HeroVisual } from '../components/three/HeroVisual.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';

const reveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const revealItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const legend = [
  { label: 'Projects', className: 'bg-zinc-300' },
  { label: 'Tasks', className: 'bg-indigo-300' },
  { label: 'Progress', className: 'bg-cyan-300' },
];

/** Split-screen shell for login and register: form on the left, 3D visual on the right. */
export default function AuthLayout({ title, highlight, description, children }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="app-backdrop relative min-h-dvh overflow-hidden">
      <div className="relative mx-auto grid min-h-dvh max-w-[1440px] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
          <Logo />

          {!isDesktop && (
            <div
              className="relative mt-6 h-36 overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-900/40 sm:h-48"
              aria-hidden="true"
            >
              <HeroVisual variant="compact" />
            </div>
          )}

          <div className="flex flex-1 items-center py-10">
            <motion.div className="w-full max-w-[34rem]" initial="hidden" animate="visible" variants={reveal}>
              <motion.h1
                variants={revealItem}
                className="text-[2.6rem] leading-[1.02] font-semibold tracking-[-0.035em] text-zinc-50 sm:text-5xl xl:text-[3.6rem]"
              >
                {title}
                <br />
                <span className="text-gradient font-display text-[1.12em] font-normal tracking-[-0.01em] italic">
                  {highlight}
                </span>
              </motion.h1>
              <motion.p variants={revealItem} className="mt-5 max-w-[26rem] text-base leading-relaxed text-zinc-400">
                {description}
              </motion.p>
              <motion.div variants={revealItem} className="mt-9 max-w-[26rem]">
                {children}
              </motion.div>
            </motion.div>
          </div>

          <p className="text-xs text-zinc-600">One account for the Orbit web and Android apps.</p>
        </section>

        {isDesktop && (
          <aside className="relative py-5 pr-5" aria-hidden="true">
            <div className="relative h-full overflow-hidden rounded-[2rem] border border-white/[0.07] bg-ink-900/40">
              <div className="grid-backdrop absolute inset-0" />
              <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-indigo-500/10 to-transparent" />
              <HeroVisual variant="full" />
              <div className="absolute bottom-6 left-6 flex items-center gap-4 rounded-full border border-white/10 bg-ink-950/60 px-4 py-2 text-xs text-zinc-400 backdrop-blur-md">
                {legend.map((item, index) => (
                  <span key={item.label} className="inline-flex items-center gap-2">
                    {index > 0 && <span className="text-zinc-600">→</span>}
                    <span className={`size-1.5 rounded-full ${item.className}`} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
