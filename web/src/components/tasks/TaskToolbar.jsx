import {
  EMPTY_TASK_FILTERS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../../utils/constants.js';
import { Button } from '../ui/Button.jsx';
import { InlineSelect } from '../ui/Field.jsx';
import { SearchInput } from '../ui/SearchInput.jsx';

const STATUS_FILTERS = [{ value: '', label: 'All statuses' }, ...TASK_STATUS_OPTIONS];
const PRIORITY_FILTERS = [{ value: '', label: 'All priorities' }, ...TASK_PRIORITY_OPTIONS];

export function TaskToolbar({ filters, onChange }) {
  const update = (field) => (value) => onChange({ ...filters, [field]: value });
  const active = Boolean(filters.search || filters.status || filters.priority);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={filters.search}
        onChange={update('search')}
        label="Search tasks by name"
        placeholder="Search tasks…"
        className="sm:max-w-xs sm:flex-1"
      />
      <div className="flex gap-2">
        <InlineSelect
          label="Filter by status"
          size="md"
          options={STATUS_FILTERS}
          value={filters.status}
          onChange={(event) => update('status')(event.target.value)}
          className="w-full sm:w-40"
        />
        <InlineSelect
          label="Filter by priority"
          size="md"
          options={PRIORITY_FILTERS}
          value={filters.priority}
          onChange={(event) => update('priority')(event.target.value)}
          className="w-full sm:w-40"
        />
      </div>
      {active && (
        <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_TASK_FILTERS)}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
