import { useState } from 'react';
import { taskService } from '../../services/taskService.js';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../../utils/constants.js';
import { validateTask } from '../../utils/validation.js';
import { Button } from '../ui/Button.jsx';
import { Alert } from '../ui/Feedback.jsx';
import { SelectField, TextAreaField, TextField } from '../ui/Field.jsx';
import { Modal } from '../ui/Modal.jsx';

function TaskForm({ projectId, task, onCancel, onSaved }) {
  const [values, setValues] = useState(() => ({
    name: task?.name ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? 'PENDING',
    dueDate: task?.dueDate ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const validationErrors = validateTask(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate || null,
    };

    setSaving(true);
    try {
      const saved = task
        ? await taskService.update(task.id, payload)
        : await taskService.create({ ...payload, projectId });
      onSaved(saved);
    } catch (error) {
      const fieldErrors = error.fieldErrors ?? {};
      setErrors(fieldErrors);
      setFormError(Object.keys(fieldErrors).length > 0 ? null : error.message);
      setSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      {formError && <Alert>{formError}</Alert>}
      <TextField
        label="Task name"
        name="name"
        placeholder="e.g. Write release notes"
        maxLength={160}
        value={values.name}
        onChange={handleChange('name')}
        error={errors.name}
        autoFocus
      />
      <TextAreaField
        label="Description"
        name="description"
        optional
        rows={3}
        maxLength={2000}
        placeholder="Add details, links or acceptance criteria"
        value={values.description}
        onChange={handleChange('description')}
        error={errors.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Priority"
          name="priority"
          options={TASK_PRIORITY_OPTIONS}
          value={values.priority}
          onChange={handleChange('priority')}
          error={errors.priority}
        />
        <SelectField
          label="Status"
          name="status"
          options={TASK_STATUS_OPTIONS}
          value={values.status}
          onChange={handleChange('status')}
          error={errors.status}
        />
      </div>
      <TextField
        label="Due date"
        type="date"
        name="dueDate"
        optional
        value={values.dueDate}
        onChange={handleChange('dueDate')}
        error={errors.dueDate}
      />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}

export function TaskFormModal({ open, projectId, task, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      description={task ? 'Update the task details.' : 'Add a task to this project.'}
    >
      <TaskForm projectId={projectId} task={task} onCancel={onClose} onSaved={onSaved} />
    </Modal>
  );
}
