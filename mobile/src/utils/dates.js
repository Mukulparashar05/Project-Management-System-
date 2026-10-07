// The API exchanges calendar dates as "YYYY-MM-DD" strings. Formatting is done by hand so the
// output is identical on every device, independent of locale and timezone data.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function parts(value) {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

export function formatCalendarDate(value) {
  if (!value) return null;
  const { year, month, day } = parts(value);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function formatTimestamp(isoString) {
  return isoString ? formatCalendarDate(toCalendarDate(new Date(isoString))) : null;
}

export function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return 'No dates set';
  if (startDate && endDate) return `${formatCalendarDate(startDate)} → ${formatCalendarDate(endDate)}`;
  return startDate ? `Starts ${formatCalendarDate(startDate)}` : `Ends ${formatCalendarDate(endDate)}`;
}

/** Local calendar date of a Date object, e.g. the value picked in the native date picker. */
export function toCalendarDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromCalendarDate(value) {
  const { year, month, day } = parts(value);
  return new Date(year, month - 1, day);
}

export function todayCalendarDate() {
  return toCalendarDate(new Date());
}

export function daysFromToday(value) {
  const target = fromCalendarDate(value);
  const today = fromCalendarDate(todayCalendarDate());
  return Math.round((target - today) / MILLISECONDS_PER_DAY);
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
  return `Due ${formatCalendarDate(value)}`;
}

export function greetingForTime(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
