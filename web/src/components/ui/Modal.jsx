import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';

/**
 * Accessible modal built on the native <dialog> element: showModal() gives focus trapping,
 * Escape handling, an inert background and focus restoration for free.
 */
export function Modal({ open, onClose, title, description, children, width = '32rem', role = 'dialog' }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="modal"
      style={{ '--modal-width': width }}
      onCancel={(event) => {
        // Keep React state as the single source of truth for whether the dialog is open.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      {open && (
        <div className="glass max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-ink-900/95 p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold tracking-tight text-zinc-50">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-zinc-400">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mt-1 -mr-2 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100"
              aria-label="Close dialog"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
