import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { fromDateOnlyString, toDateOnlyString } from '../utils/dates.js';
import { nameContains } from '../utils/search.js';
import { findOwnedProject } from './project.service.js';

const taskSelect = {
  id: true,
  projectId: true,
  name: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true } },
};

function serializeTask(task) {
  return { ...task, dueDate: toDateOnlyString(task.dueDate) };
}

function toTaskData(input) {
  return {
    name: input.name,
    description: input.description,
    priority: input.priority,
    status: input.status,
    dueDate: fromDateOnlyString(input.dueDate),
  };
}

// Same rule as projects: a task that belongs to someone else is indistinguishable from a missing one.
async function findOwnedTask(userId, taskId, select = { id: true }) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId }, select });
  if (!task) throw AppError.notFound('Task');
  return task;
}

export async function listTasks(userId, { projectId, search, status, priority }) {
  if (projectId) await findOwnedProject(userId, projectId);

  const tasks = await prisma.task.findMany({
    where: { userId, projectId, status, priority, name: nameContains(search) },
    orderBy: { createdAt: 'desc' },
    select: taskSelect,
  });
  return tasks.map(serializeTask);
}

export async function getTask(userId, taskId) {
  return serializeTask(await findOwnedTask(userId, taskId, taskSelect));
}

export async function createTask(userId, { projectId, ...input }) {
  // The target project must belong to the caller. The composite foreign key
  // (project_id, user_id) enforces the same rule again inside PostgreSQL.
  await findOwnedProject(userId, projectId);

  const task = await prisma.task.create({
    data: { ...toTaskData(input), projectId, userId },
    select: taskSelect,
  });
  return serializeTask(task);
}

export async function updateTask(userId, taskId, input) {
  await findOwnedTask(userId, taskId);
  const task = await prisma.task.update({
    where: { id: taskId, userId },
    data: toTaskData(input),
    select: taskSelect,
  });
  return serializeTask(task);
}

export async function deleteTask(userId, taskId) {
  await findOwnedTask(userId, taskId);
  return prisma.task.delete({
    where: { id: taskId, userId },
    select: { id: true, projectId: true },
  });
}
