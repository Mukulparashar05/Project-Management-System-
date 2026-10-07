export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';
export const NO_CONNECTION_MESSAGE = 'No internet connection. Please check your connection and try again.';
export const SERVER_UNREACHABLE_MESSAGE =
  'Unable to reach the Orbit server. Please check your connection and try again.';

export const PROJECT_STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const TASK_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export const STATUS_LABELS = Object.fromEntries(
  [...PROJECT_STATUS_OPTIONS, ...TASK_STATUS_OPTIONS].map(({ value, label }) => [value, label]),
);

export const PRIORITY_LABELS = Object.fromEntries(
  TASK_PRIORITY_OPTIONS.map(({ value, label }) => [value, label]),
);

export const withAllOption = (options, label = 'All') => [{ value: '', label }, ...options];
