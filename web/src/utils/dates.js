// The API sends calendar dates as "YYYY-MM-DD". They are formatted in UTC so a date never
// shifts by a day in the viewer's timezone.
const calendarDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });
const shortCalendarDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});
const timestampFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

function parseCalendarDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatCalendarDate(value, { short = false } = {}) {
  if (!value) return null;
  const formatter = short ? shortCalendarDateFormatter : calendarDateFormatter;
  return formatter.format(parseCalendarDate(value));
}

export function formatTimestamp(isoString) {
  return isoString ? timestampFormatter.format(new Date(isoString)) : null;
}

export function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'No dates set';
  if (startDate && endDate) return `${formatCalendarDate(startDate)} → ${formatCalendarDate(endDate)}`;
  return startDate ? `Starts ${formatCalendarDate(startDate)}` : `Ends ${formatCalendarDate(endDate)}`;
}

export function todayCalendarDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Whole days from today (local) until the calendar date; negative when in the past. */
export function daysFromToday(value) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((parseCalendarDate(value) - parseCalendarDate(todayCalendarDate())) / millisecondsPerDay);
}

export function isTaskOverdue(task) {
  return Boolean(task.dueDate) && task.status !== 'COMPLETED' && task.dueDate < todayCalendarDate();
}

export function describeDueDate(value) {
  const days = daysFromToday(value);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days === -1) return 'Due yesterday';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${formatCalendarDate(value, { short: true })}`;
}

export function greetingForTime(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
