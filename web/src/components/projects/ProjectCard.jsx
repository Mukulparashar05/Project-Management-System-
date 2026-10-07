import { motion } from 'framer-motion';
import { CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { formatDateRange } from '../../utils/dates.js';
import { StatusBadge } from '../ui/Badge.jsx';
import { IconButton } from '../ui/Button.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';

export function ProjectCard({ project, onEdit, onDelete }) {
  const { taskCounts } = project;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="glass group relative flex flex-col rounded-2xl p-5 transition-colors hover:border-white/15"
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={project.status} />
        <div className="relative z-10 -mt-1 -mr-1 flex gap-0.5">
          <IconButton icon={Pencil} label={`Edit ${project.name}`} onClick={() => onEdit(project)} />
          <IconButton
            icon={Trash2}
            label={`Delete ${project.name}`}
            tone="danger"
            onClick={() => onDelete(project)}
          />
        </div>
      </div>

      <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-50">
        {/* The stretched link makes the whole card clickable while the buttons above stay usable. */}
        <Link
          to={`/projects/${project.id}`}
          className="rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-indigo-400"
        >
          {project.name}
        </Link>
      </h3>
      <p className="mt-1.5 line-clamp-2 min-h-10 text-sm text-zinc-400">
        {project.description || <span className="text-zinc-600">No description</span>}
      </p>

      <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <CalendarDays className="size-3.5" aria-hidden="true" />
        {formatDateRange(project.startDate, project.endDate)}
      </p>

      <div className="mt-5 border-t border-white/[0.06] pt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            {taskCounts.completed} of {taskCounts.total} {taskCounts.total === 1 ? 'task' : 'tasks'} done
          </span>
          <span className="font-medium text-zinc-200 tabular-nums">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} label={`${project.name} progress`} />
      </div>
    </motion.article>
  );
}
