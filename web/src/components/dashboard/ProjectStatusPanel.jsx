import { Link } from 'react-router';
import { ProgressBar } from '../ui/ProgressBar.jsx';

const rows = [
  { key: 'NOT_STARTED', label: 'Not started' },
  { key: 'IN_PROGRESS', label: 'In progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

export function ProjectStatusPanel({ projectsByStatus, totalProjects }) {
  return (
    <section className="glass rounded-2xl p-6" aria-labelledby="project-status-heading">
      <div className="flex items-center justify-between">
        <h2 id="project-status-heading" className="text-sm font-medium text-zinc-300">
          Projects by status
        </h2>
        <Link to="/projects" className="text-xs font-medium text-indigo-300 hover:text-indigo-200">
          View all
        </Link>
      </div>
      <ul className="mt-5 space-y-4">
        {rows.map(({ key, label }) => {
          const count = projectsByStatus[key];
          const percent = totalProjects === 0 ? 0 : (count / totalProjects) * 100;
          return (
            <li key={key}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">{label}</span>
                <span className="font-medium text-zinc-100 tabular-nums">{count}</span>
              </div>
              <ProgressBar value={percent} label={`${label} projects`} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
