import { CalendarCheck2 } from 'lucide-react';
import { Link } from 'react-router';
import { describeDueDate, isTaskOverdue } from '../../utils/dates.js';
import { PriorityBadge } from '../ui/Badge.jsx';

export function UpcomingTasks({ tasks }) {
  return (
    <section className="glass rounded-2xl p-6" aria-labelledby="upcoming-heading">
      <h2 id="upcoming-heading" className="text-sm font-medium text-zinc-300">
        Up next
      </h2>
      <p className="mt-1 text-xs text-zinc-500">Open tasks with the nearest due dates</p>

      {tasks.length === 0 ? (
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-white/[0.025] px-4 py-5 text-sm text-zinc-400 ring-1 ring-white/[0.05]">
          <CalendarCheck2 className="size-4 text-emerald-300" aria-hidden="true" />
          No upcoming deadlines. Tasks with a due date will show up here.
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-white/[0.05]">
          {tasks.map((task) => {
            const overdue = isTaskOverdue(task);
            return (
              <li key={task.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <Link
                    to={`/projects/${task.project.id}`}
                    className="block truncate text-sm font-medium text-zinc-100 hover:text-indigo-200"
                  >
                    {task.name}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {task.project.name} ·{' '}
                    <span className={overdue ? 'text-rose-300' : ''}>{describeDueDate(task.dueDate)}</span>
                  </p>
                </div>
                <PriorityBadge priority={task.priority} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
