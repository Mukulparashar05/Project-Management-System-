import { Activity, CircleCheckBig, FolderKanban, FolderPlus, Hourglass, ListTodo, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CompletionPanel } from '../components/dashboard/CompletionPanel.jsx';
import { ProjectStatusPanel } from '../components/dashboard/ProjectStatusPanel.jsx';
import { StatCard } from '../components/dashboard/StatCard.jsx';
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks.jsx';
import { ProjectFormModal } from '../components/projects/ProjectFormModal.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useAuth } from '../hooks/useAuth.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useToast } from '../hooks/useToast.js';
import { dashboardService } from '../services/dashboardService.js';
import { greetingForTime } from '../utils/dates.js';

function statCards(stats) {
  return [
    { label: 'Total projects', value: stats.totalProjects, icon: FolderKanban, tone: 'indigo' },
    { label: 'Total tasks', value: stats.totalTasks, icon: ListTodo, tone: 'sky' },
    {
      label: 'Completed tasks',
      value: stats.completedTasks,
      icon: CircleCheckBig,
      tone: 'emerald',
      hint: `${stats.completionRate}% of all tasks`,
    },
    {
      label: 'Pending tasks',
      value: stats.pendingTasks,
      icon: Hourglass,
      tone: 'amber',
      hint: `${stats.inProgressTasks} more in progress`,
    },
    { label: 'Projects in progress', value: stats.projectsInProgress, icon: Activity, tone: 'violet' },
  ];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-64 rounded-2xl lg:col-span-3" />
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [creatingProject, setCreatingProject] = useState(false);

  const { data, error, isLoading, isRefreshing, reload } = useApiQuery(
    ({ signal }) => dashboardService.get({ signal }),
    [],
    { refetchOnFocus: true },
  );

  const firstName = user.fullName.split(' ')[0];

  function handleProjectCreated(project) {
    setCreatingProject(false);
    toast.success('Project created');
    navigate(`/projects/${project.id}`);
  }

  let content;
  if (isLoading) {
    content = <DashboardSkeleton />;
  } else if (error && !data) {
    content = <ErrorState title="Couldn’t load your dashboard" message={error.message} onRetry={reload} />;
  } else {
    const { stats, projectsByStatus, tasksByStatus, upcomingTasks } = data;
    content = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {statCards(stats).map((card, index) => (
            <StatCard key={card.label} index={index} {...card} />
          ))}
        </div>

        {stats.totalProjects === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="Start your first project"
            description="Projects hold your tasks. Create one and your progress will appear here."
            action={
              <Button icon={Plus} onClick={() => setCreatingProject(true)}>
                Create a project
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <CompletionPanel
                completionRate={stats.completionRate}
                tasksByStatus={tasksByStatus}
                totalTasks={stats.totalTasks}
              />
              <ProjectStatusPanel projectsByStatus={projectsByStatus} totalProjects={stats.totalProjects} />
            </div>
            <div className="lg:col-span-2">
              <UpcomingTasks tasks={upcomingTasks} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`${greetingForTime()}, ${firstName}`}
        description="A live summary of your projects and tasks."
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} loading={isRefreshing} onClick={reload}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => setCreatingProject(true)}>
              New project
            </Button>
          </>
        }
      />
      {content}
      <ProjectFormModal
        open={creatingProject}
        onClose={() => setCreatingProject(false)}
        onSaved={handleProjectCreated}
      />
    </>
  );
}
