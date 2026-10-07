import { motion } from 'framer-motion';
import { CalendarDays, Check, Clock, Pencil, Trash2 } from 'lucide-react';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../utils/constants.js';
import { describeDueDate, formatCalendarDate, formatTimestamp, isTaskOverdue } from '../../utils/dates.js';
import { IconButton } from '../ui/Button.jsx';
import { InlineSelect } from '../ui/Field.jsx';

const statusTone = {
  PENDING: 'border-white/10 bg-white/[0.03] text-zinc-300',
  IN_PROGRESS: 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200',
  COMPLETED: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
};

const priorityTone = {
  LOW: 'border-white/10 bg-white/[0.03] text-zinc-300',
  MEDIUM: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  HIGH: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
};

const PRIORITY_CHOICES = TASK_PRIORITY_OPTIONS.map((option) => ({
  ...option,
  label: `${option.label} priority`,
}));

export function TaskItem({ task, busy, onToggleComplete, onStatusChange, onPriorityChange, onEdit, onDelete }) {
  const completed = task.status === 'COMPLETED';
  const overdue = isTaskOverdue(task);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`surface flex flex-col gap-4 rounded-2xl p-4 transition-colors md:flex-row md:items-center ${
        busy ? 'opacity-70' : ''
      }`}
      aria-busy={busy || undefined}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          aria-label={completed ? `Mark “${task.name}” as not completed` : `Mark “${task.name}” as completed`}
          onClick={onToggleComplete}
          disabled={busy}
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
            completed
              ? 'border-emerald-400 bg-emerald-400 text-ink-950'
              : 'border-white/25 hover:border-emerald-300 hover:bg-emerald-400/10'
          }`}
        >
          {completed && <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />}
        </button>

        <div className="min-w-0">
          <p
            className={`font-medium break-words ${
              completed ? 'text-zinc-500 line-through decoration-zinc-600' : 'text-zinc-100'
            }`}
          >
            {task.name}
          </p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-sm break-words text-zinc-400">{task.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1.5 ${overdue ? 'text-rose-300' : ''}`}>
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {completed ? `Due ${formatCalendarDate(task.dueDate)}` : describeDueDate(task.dueDate)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              Created {formatTimestamp(task.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-8 md:flex-nowrap md:pl-0">
        <InlineSelect
          label={`Status of ${task.name}`}
          options={TASK_STATUS_OPTIONS}
          value={task.status}
          onChange={(event) => onStatusChange(event.target.value)}
          disabled={busy}
          toneClass={statusTone[task.status]}
          className="w-[8.5rem]"
        />
        <InlineSelect
          label={`Priority of ${task.name}`}
          options={PRIORITY_CHOICES}
          value={task.priority}
          onChange={(event) => onPriorityChange(event.target.value)}
          disabled={busy}
          toneClass={priorityTone[task.priority]}
          className="w-[9.5rem]"
        />
        <div className="ml-auto flex md:ml-1">
          <IconButton icon={Pencil} label={`Edit ${task.name}`} onClick={onEdit} disabled={busy} />
          <IconButton icon={Trash2} label={`Delete ${task.name}`} tone="danger" onClick={onDelete} disabled={busy} />
        </div>
      </div>
    </motion.li>
  );
}
