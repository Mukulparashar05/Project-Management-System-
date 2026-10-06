import { TaskPriority, TaskStatus } from '@prisma/client';
import { z } from 'zod';
import {
  enumField,
  hasAnyField,
  optionalDate,
  optionalDescription,
  optionalQuery,
  requiredName,
  requiredUuid,
  searchQuery,
} from './common.validators.js';

const taskStatus = enumField(TaskStatus, 'Status');
const taskPriority = enumField(TaskPriority, 'Priority');
const taskName = requiredName('Task name', 160);

export const createTaskSchema = z.strictObject({
  projectId: requiredUuid('Project'),
  name: taskName,
  description: optionalDescription,
  priority: taskPriority.default(TaskPriority.MEDIUM),
  status: taskStatus.default(TaskStatus.PENDING),
  dueDate: optionalDate,
});

// A task stays in the project it was created in, so projectId is not updatable.
export const updateTaskSchema = z
  .strictObject({
    name: taskName.optional(),
    description: optionalDescription,
    priority: taskPriority.optional(),
    status: taskStatus.optional(),
    dueDate: optionalDate,
  })
  .refine(hasAnyField, { error: 'Provide at least one field to update' });

export const listTasksQuerySchema = z.object({
  projectId: optionalQuery(z.uuid('Project id must be a valid id')),
  search: searchQuery,
  status: optionalQuery(taskStatus),
  priority: optionalQuery(taskPriority),
});
