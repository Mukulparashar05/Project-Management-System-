import { AnimatePresence, motion } from 'framer-motion';
import { FolderKanban, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Logo } from '../components/brand/Logo.jsx';
import { IconButton } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Feedback.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function NavItems({ onNavigate }) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/[0.07] text-zinc-50 ring-1 ring-white/10'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100'
              }`
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function UserCard({ user, onLogout, loggingOut }) {
  return (
    <div className="surface flex items-center gap-3 rounded-2xl p-3">
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-400/30 to-cyan-300/15 text-xs font-semibold text-indigo-100 ring-1 ring-white/10"
        aria-hidden="true"
      >
        {initialsOf(user.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">{user.fullName}</p>
        <p className="truncate text-xs text-zinc-500">{user.email}</p>
      </div>
      <IconButton icon={LogOut} label="Log out" onClick={onLogout} disabled={loggingOut} />
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    toast.info('You have been logged out.');
  }

  return (
    <div className="app-backdrop min-h-dvh">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-zinc-50 px-4 py-2 text-sm font-medium text-ink-950 focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/[0.06] bg-ink-950/70 px-5 py-6 backdrop-blur-xl lg:flex">
        <Logo className="px-2" />
        <nav aria-label="Main" className="mt-10 flex-1">
          <p className="mb-3 px-3 text-[0.7rem] font-medium tracking-[0.16em] text-zinc-500 uppercase">
            Workspace
          </p>
          <NavItems />
        </nav>
        <UserCard user={user} onLogout={handleLogout} loggingOut={loggingOut} />
      </aside>

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <IconButton
            icon={menuOpen ? X : Menu}
            label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="size-10"
          />
        </div>
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              id="mobile-navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-white/[0.06]"
              onKeyDown={(event) => event.key === 'Escape' && setMenuOpen(false)}
            >
              <nav aria-label="Main" className="space-y-4 px-4 py-4">
                <NavItems onNavigate={() => setMenuOpen(false)} />
                <UserCard user={user} onLogout={handleLogout} loggingOut={loggingOut} />
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="main-content" className="lg:pl-72">
        <div className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6 lg:px-10 lg:pt-12">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Suspense fallback={<Spinner label="Loading page" className="py-24" />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
