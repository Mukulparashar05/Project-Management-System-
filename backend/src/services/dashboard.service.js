import { ProjectStatus, TaskStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { toDateOnlyString } from '../utils/dates.js';

const UPCOMING_TASK_LIMIT = 5;

function toCountMap(groups, keys) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const group of groups) counts[group.status] = group._count._all;
  return counts;
}

const sum = (counts) => Object.values(counts).reduce((total, count) => total + count, 0);

/** All figures are aggregated live in PostgreSQL for the authenticated user only. */
export async function getDashboard(userId) {
  const [projectGroups, taskGroups, upcomingTasks] = await Promise.all([
    prisma.project.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['status'], where: { userId }, _count: { _all: true } }),
    prisma.task.findMany({
      where: { userId, status: { not: TaskStatus.COMPLETED }, dueDate: { not: null } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
      take: UPCOMING_TASK_LIMIT,
      select: {
        id: true,
        projectId: true,
        name: true,
        priority: true,
        status: true,
        dueDate: true,
        project: { select: { id: true, name: true } },
      },
    }),
  ]);

  const projectsByStatus = toCountMap(projectGroups, Object.values(ProjectStatus));
  const tasksByStatus = toCountMap(taskGroups, Object.values(TaskStatus));
  const totalTasks = sum(tasksByStatus);

  return {
    stats: {
      totalProjects: sum(projectsByStatus),
      totalTasks,
      completedTasks: tasksByStatus.COMPLETED,
      pendingTasks: tasksByStatus.PENDING,
      inProgressTasks: tasksByStatus.IN_PROGRESS,
      projectsInProgress: projectsByStatus.IN_PROGRESS,
      completionRate: totalTasks === 0 ? 0 : Math.round((tasksByStatus.COMPLETED / totalTasks) * 100),
    },
    projectsByStatus,
    tasksByStatus,
    upcomingTasks: upcomingTasks.map((task) => ({ ...task, dueDate: toDateOnlyString(task.dueDate) })),
  };
}
