import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './toastContext.js';

const TOAST_DURATION_MS = 4500;
const MAX_VISIBLE_TOASTS = 4;

const toastStyles = {
  success: { icon: CircleCheck, className: 'text-emerald-300' },
  error: { icon: CircleAlert, className: 'text-rose-300' },
  info: { icon: Info, className: 'text-indigo-300' },
};

let nextToastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (type, message) => {
      nextToastId += 1;
      const id = nextToastId;
      setToasts((current) => [...current.slice(-(MAX_VISIBLE_TOASTS - 1)), { id, type, message }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext value={toast}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map(({ id, type, message }) => {
            const { icon: Icon, className } = toastStyles[type];
            return (
              <motion.div
                key={id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-ink-900/90 px-4 py-3 text-sm"
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${className}`} aria-hidden="true" />
                <p className="flex-1 text-zinc-100">{message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(id)}
                  className="-m-1 rounded-lg p-1 text-zinc-400 transition-colors hover:text-zinc-100"
                  aria-label="Dismiss notification"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}
