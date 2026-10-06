import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { fromDateOnlyString, toDateOnlyString } from '../utils/dates.js';
import { nameContains } from '../utils/search.js';
import { DATE_RANGE_ERROR, isDateRangeValid } from '../validators/common.validators.js';

const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
};

const countKeyByTaskStatus = { PENDING: 'pending', IN_PROGRESS: 'inProgress', COMPLETED: 'completed' };

const emptyTaskCounts = () => ({ total: 0, pending: 0, inProgress: 0, completed: 0 });

async function getTaskCounts(userId, projectIds) {
  const counts = new Map(projectIds.map((id) => [id, emptyTaskCounts()]));
  if (projectIds.length === 0) return counts;

  const groups = await prisma.task.groupBy({
    by: ['projectId', 'status'],
    where: { userId, projectId: { in: projectIds } },
    _count: { _all: true },
  });

  for (const group of groups) {
    const projectCounts = counts.get(group.projectId);
    projectCounts[countKeyByTaskStatus[group.status]] += group._count._all;
    projectCounts.total += group._count._all;
  }
  return counts;
}

function serializeProject(project, taskCounts = emptyTaskCounts()) {
  return {
    ...project,
    startDate: toDateOnlyString(project.startDate),
    endDate: toDateOnlyString(project.endDate),
    taskCounts,
    progress: taskCounts.total === 0 ? 0 : Math.round((taskCounts.completed / taskCounts.total) * 100),
  };
}

// Undefined values are ignored by Prisma, which is what makes partial updates work.
function toProjectData(input) {
  return {
    name: input.name,
    description: input.description,
    status: input.status,
    startDate: fromDateOnlyString(input.startDate),
    endDate: fromDateOnlyString(input.endDate),
  };
}

/**
 * Ownership check used by every project operation (and by task operations that target a project).
 * Another user's project is reported as "not found" so its existence is never revealed.
 */
export async function findOwnedProject(userId, projectId, select = { id: true }) {
  const project = await prisma.project.findFirst({ where: { id: projectId, userId }, select });
  if (!project) throw AppError.notFound('Project');
  return project;
}

export async function listProjects(userId, { search, status }) {
  const projects = await prisma.project.findMany({
    where: { userId, status, name: nameContains(search) },
    orderBy: { createdAt: 'desc' },
    select: projectSelect,
  });

  const counts = await getTaskCounts(
    userId,
    projects.map((project) => project.id),
  );
  return projects.map((project) => serializeProject(project, counts.get(project.id)));
}

export async function getProject(userId, projectId) {
  const project = await findOwnedProject(userId, projectId, projectSelect);
  const counts = await getTaskCounts(userId, [project.id]);
  return serializeProject(project, counts.get(project.id));
}

export async function createProject(userId, input) {
  const project = await prisma.project.create({
    data: { ...toProjectData(input), userId },
    select: projectSelect,
  });
  return serializeProject(project);
}

export async function updateProject(userId, projectId, input) {
  const existing = await findOwnedProject(userId, projectId, { startDate: true, endDate: true });

  const startDate = input.startDate !== undefined ? input.startDate : toDateOnlyString(existing.startDate);
  const endDate = input.endDate !== undefined ? input.endDate : toDateOnlyString(existing.endDate);
  if (!isDateRangeValid(startDate, endDate)) {
    throw AppError.validation([{ field: 'endDate', message: DATE_RANGE_ERROR }]);
  }

  const project = await prisma.project.update({
    where: { id: projectId, userId },
    data: toProjectData(input),
    select: projectSelect,
  });
  const counts = await getTaskCounts(userId, [project.id]);
  return serializeProject(project, counts.get(project.id));
}

export async function deleteProject(userId, projectId) {
  await findOwnedProject(userId, projectId);
  // Tasks are removed by the ON DELETE CASCADE foreign key.
  return prisma.project.delete({ where: { id: projectId, userId }, select: { id: true } });
}
