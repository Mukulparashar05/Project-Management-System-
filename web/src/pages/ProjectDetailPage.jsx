import { AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Clock,
  FolderOpen,
  LoaderCircle,
  Pencil,
  Plus,
  SearchX,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ProjectFormModal } from '../components/projects/ProjectFormModal.jsx';
import { TaskFormModal } from '../components/tasks/TaskFormModal.jsx';
import { TaskItem } from '../components/tasks/TaskItem.jsx';
import { TaskToolbar } from '../components/tasks/TaskToolbar.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button, ButtonLink } from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { InlineSelect } from '../components/ui/Field.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useToast } from '../hooks/useToast.js';
import { projectService } from '../services/projectService.js';
import { taskService } from '../services/taskService.js';
import {
  EMPTY_TASK_FILTERS,
  PRIORITY_LABELS,
  PROJECT_STATUS_OPTIONS,
  STATUS_LABELS,
} from '../utils/constants.js';
import { formatDateRange, formatTimestamp } from '../utils/dates.js';

function ProjectDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading project">
      <Skeleton className="mb-6 h-5 w-32" />
      <Skeleton className="h-72 rounded-3xl" />
      <Skeleton className="mt-10 h-8 w-40" />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function deletionCopy(deletion, project) {
  if (!deletion) return { title: '', description: '' };
  if (deletion.type === 'task') {
    return {
      title: 'Delete task?',
      description: `“${deletion.task.name}” will be permanently deleted.`,
      confirmLabel: 'Delete task',
    };
  }
  const { total } = project.taskCounts;
  const taskNote = total > 0 ? ` along with its ${total} ${total === 1 ? 'task' : 'tasks'}` : '';
  return {
    title: 'Delete project?',
    description: `“${project.name}” will be permanently deleted${taskNote}. This cannot be undone.`,
    confirmLabel: 'Delete project',
  };
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  // Keyed so local state (filters, dialogs) resets when moving between projects.
  return <ProjectDetail key={projectId} projectId={projectId} />;
}

function ProjectDetail({ projectId }) {
  const navigate = useNavigate();
  const toast = useToast();

  const projectQuery = useApiQuery(
    ({ signal }) => projectService.get(projectId, { signal }),
    [projectId],
    { refetchOnFocus: true },
  );
  const project = projectQuery.data;
  useDocumentTitle(project?.name ?? 'Project');

  const [filters, setFilters] = useState(EMPTY_TASK_FILTERS);
  const search = useDebouncedValue(filters.search.trim(), 300);
  const tasksQuery = useApiQuery(
    ({ signal }) =>
      taskService.list(
        { projectId, search, status: filters.status, priority: filters.priority },
        { signal },
      ),
    [projectId, search, filters.status, filters.priority],
    { keepPreviousData: true, refetchOnFocus: true },
  );
  const tasks = tasksQuery.data;

  const [taskEditor, setTaskEditor] = useState(null);
  const [projectEditorOpen, setProjectEditorOpen] = useState(false);
  const [deletion, setDeletion] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyTaskIds, setBusyTaskIds] = useState(() => new Set());
  const [savingStatus, setSavingStatus] = useState(false);

  function setTaskBusy(taskId, busy) {
    setBusyTaskIds((current) => {
      const next = new Set(current);
      if (busy) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }

  async function updateTask(task, changes, successMessage) {
    setTaskBusy(task.id, true);
    try {
      const updated = await taskService.update(task.id, changes);
      tasksQuery.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)));
      projectQuery.reload();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTaskBusy(task.id, false);
    }
  }

  function toggleComplete(task) {
    return task.status === 'COMPLETED'
      ? updateTask(task, { status: 'PENDING' }, 'Task reopened')
      : updateTask(task, { status: 'COMPLETED' }, 'Task marked as completed');
  }

  async function changeProjectStatus(status) {
    setSavingStatus(true);
    try {
      const updated = await projectService.update(projectId, { status });
      projectQuery.setData(updated);
      toast.success(`Project marked as ${STATUS_LABELS[status].toLowerCase()}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingStatus(false);
    }
  }

  function handleTaskSaved(saved) {
    toast.success(taskEditor?.task ? 'Task updated' : `Task “${saved.name}” created`);
    setTaskEditor(null);
    tasksQuery.reload();
    projectQuery.reload();
  }

  function handleProjectSaved(saved) {
    toast.success('Project updated');
    setProjectEditorOpen(false);
    projectQuery.setData(saved);
  }

  async function confirmDeletion() {
    setDeleting(true);
    try {
      if (deletion.type === 'project') {
        await projectService.remove(projectId);
        toast.success(`Deleted “${project.name}”`);
        navigate('/projects', { replace: true });
        return;
      }
      await taskService.remove(deletion.task.id);
      tasksQuery.setData((current) => current?.filter((item) => item.id !== deletion.task.id));
      projectQuery.reload();
      toast.success('Task deleted');
      setDeletion(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (projectQuery.isLoading) return <ProjectDetailSkeleton />;

  // A 404 also covers projects deleted from another device after this page was opened.
  if (projectQuery.error?.status === 404) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="Project not found"
        description="This project doesn’t exist anymore, or it belongs to a different account."
        action={
          <ButtonLink to="/projects" variant="secondary" icon={ArrowLeft}>
            Back to projects
          </ButtonLink>
        }
      />
    );
  }

  if (!project) {
    return (
      <ErrorState
        title="Couldn’t load this project"
        message={projectQuery.error?.message}
        onRetry={projectQuery.reload}
      />
    );
  }

  const { taskCounts } = project;
  const filtersActive = Boolean(search || filters.status || filters.priority);
  const copy = deletionCopy(deletion, project);

  let tasksContent;
  if (tasksQuery.isLoading) {
    tasksContent = (
      <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  } else if (tasksQuery.error && !tasks) {
    tasksContent = (
      <ErrorState title="Couldn’t load tasks" message={tasksQuery.error.message} onRetry={tasksQuery.reload} />
    );
  } else if (tasks.length === 0) {
    tasksContent = filtersActive ? (
      <EmptyState
        icon={SearchX}
        title="No tasks match your filters"
        description="Try another search term, status or priority."
        action={
          <Button variant="secondary" onClick={() => setFilters(EMPTY_TASK_FILTERS)}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={ClipboardList}
        title="No tasks yet"
        description="Break this project into tasks to start tracking progress."
        action={
          <Button icon={Plus} onClick={() => setTaskEditor({})}>
            Add the first task
          </Button>
        }
      />
    );
  } else {
    tasksContent = (
      <ul className="space-y-3" aria-label="Tasks">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              busy={busyTaskIds.has(task.id)}
              onToggleComplete={() => toggleComplete(task)}
              onStatusChange={(status) => updateTask(task, { status }, `Status set to ${STATUS_LABELS[status]}`)}
              onPriorityChange={(priority) =>
                updateTask(task, { priority }, `Priority set to ${PRIORITY_LABELS[priority]}`)
              }
              onEdit={() => setTaskEditor({ task })}
              onDelete={() => setDeletion({ type: 'task', task })}
            />
          ))}
        </AnimatePresence>
      </ul>
    );
  }

  return (
    <>
      <Link
        to="/projects"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-zinc-100"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All projects
      </Link>

      <section className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8" aria-labelledby="project-title">
        <div
          className="pointer-events-none absolute -top-28 -right-16 size-80 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <StatusBadge status={project.status} />
              {projectQuery.isRefreshing && (
                <LoaderCircle className="size-3.5 animate-spin text-zinc-500" aria-label="Refreshing" />
              )}
            </div>
            <h1
              id="project-title"
              className="mt-4 text-3xl font-semibold tracking-tight break-words text-zinc-50 sm:text-4xl"
            >
              {project.name}
            </h1>
            <p className={`mt-3 max-w-2xl whitespace-pre-line ${project.description ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {project.description || 'No description'}
            </p>
            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Timeline</dt>
                <dd className="mt-1 flex items-center gap-2 text-zinc-200">
                  <CalendarDays className="size-4 text-zinc-500" aria-hidden="true" />
                  {formatDateRange(project.startDate, project.endDate)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Created</dt>
                <dd className="mt-1 flex items-center gap-2 text-zinc-200">
                  <Clock className="size-4 text-zinc-500" aria-hidden="true" />
                  {formatTimestamp(project.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <InlineSelect
              label="Project status"
              size="md"
              options={PROJECT_STATUS_OPTIONS}
              value={project.status}
              onChange={(event) => changeProjectStatus(event.target.value)}
              disabled={savingStatus}
              className="w-full sm:w-44"
            />
            <div className="flex gap-2">
              <Button variant="secondary" icon={Pencil} onClick={() => setProjectEditorOpen(true)}>
                Edit
              </Button>
              <Button
                variant="secondary"
                icon={Trash2}
                onClick={() => setDeletion({ type: 'project' })}
                className="hover:text-rose-200"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="relative mt-8 border-t border-white/[0.06] pt-6">
          <div className="mb-2.5 flex items-center justify-between text-sm">
            <span className="text-zinc-400">
              {taskCounts.completed} of {taskCounts.total} {taskCounts.total === 1 ? 'task' : 'tasks'} completed
            </span>
            <span className="font-semibold text-zinc-100 tabular-nums">{project.progress}%</span>
          </div>
          <ProgressBar value={project.progress} label="Project progress" className="h-2" />
          <ul className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
            <li className="rounded-full bg-white/[0.04] px-3 py-1 ring-1 ring-white/[0.06]">
              {taskCounts.pending} pending
            </li>
            <li className="rounded-full bg-indigo-500/10 px-3 py-1 text-indigo-200 ring-1 ring-indigo-400/20">
              {taskCounts.inProgress} in progress
            </li>
            <li className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200 ring-1 ring-emerald-400/20">
              {taskCounts.completed} completed
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="tasks-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="tasks-heading" className="text-xl font-semibold tracking-tight text-zinc-50">
              Tasks
            </h2>
            <p className="mt-1 text-sm text-zinc-400">Check tasks off, or change status and priority inline.</p>
          </div>
          <Button icon={Plus} onClick={() => setTaskEditor({})}>
            New task
          </Button>
        </div>

        <TaskToolbar filters={filters} onChange={setFilters} />
        <p className="mt-3 flex h-4 items-center gap-2 text-xs text-zinc-500" aria-live="polite">
          {tasksQuery.isRefreshing && <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />}
          {tasks && `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}${filtersActive ? ' match' : ''}`}
        </p>
        <div className="mt-4">{tasksContent}</div>
      </section>

      <TaskFormModal
        open={taskEditor !== null}
        projectId={projectId}
        task={taskEditor?.task}
        onClose={() => setTaskEditor(null)}
        onSaved={handleTaskSaved}
      />
      <ProjectFormModal
        open={projectEditorOpen}
        project={project}
        onClose={() => setProjectEditorOpen(false)}
        onSaved={handleProjectSaved}
      />
      <ConfirmDialog
        open={deletion !== null}
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.confirmLabel}
        loading={deleting}
        onConfirm={confirmDeletion}
        onCancel={() => setDeletion(null)}
      />
    </>
  );
}
