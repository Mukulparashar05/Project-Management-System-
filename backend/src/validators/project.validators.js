import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';
import {
  DATE_RANGE_ERROR,
  enumField,
  hasAnyField,
  isDateRangeValid,
  optionalDate,
  optionalDescription,
  optionalQuery,
  requiredName,
  searchQuery,
} from './common.validators.js';

const projectStatus = enumField(ProjectStatus, 'Status');
const projectName = requiredName('Project name', 120);

const datesInOrder = (project) => isDateRangeValid(project.startDate, project.endDate);
const dateOrderIssue = { path: ['endDate'], error: DATE_RANGE_ERROR };

export const createProjectSchema = z
  .strictObject({
    name: projectName,
    description: optionalDescription,
    status: projectStatus.default(ProjectStatus.NOT_STARTED),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine(datesInOrder, dateOrderIssue);

// PUT accepts any subset of fields; the service re-checks the date order against stored values.
export const updateProjectSchema = z
  .strictObject({
    name: projectName.optional(),
    description: optionalDescription,
    status: projectStatus.optional(),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine(hasAnyField, { error: 'Provide at least one field to update' })
  .refine(datesInOrder, dateOrderIssue);

export const listProjectsQuerySchema = z.object({
  search: searchQuery,
  status: optionalQuery(projectStatus),
});
