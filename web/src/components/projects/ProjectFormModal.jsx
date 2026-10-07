import { useState } from 'react';
import { projectService } from '../../services/projectService.js';
import { PROJECT_STATUS_OPTIONS } from '../../utils/constants.js';
import { validateProject } from '../../utils/validation.js';
import { Button } from '../ui/Button.jsx';
import { Alert } from '../ui/Feedback.jsx';
import { SelectField, TextAreaField, TextField } from '../ui/Field.jsx';
import { Modal } from '../ui/Modal.jsx';

function ProjectForm({ project, onCancel, onSaved }) {
  const [values, setValues] = useState(() => ({
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'NOT_STARTED',
    startDate: project?.startDate ?? '',
    endDate: project?.endDate ?? '',
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
    const validationErrors = validateProject(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      status: values.status,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };

    setSaving(true);
    try {
      const saved = project
        ? await projectService.update(project.id, payload)
        : await projectService.create(payload);
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
        label="Project name"
        name="name"
        placeholder="e.g. Website redesign"
        maxLength={120}
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
        placeholder="What is this project about?"
        value={values.description}
        onChange={handleChange('description')}
        error={errors.description}
      />
      <SelectField
        label="Status"
        name="status"
        options={PROJECT_STATUS_OPTIONS}
        value={values.status}
        onChange={handleChange('status')}
        error={errors.status}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Start date"
          type="date"
          name="startDate"
          optional
          value={values.startDate}
          onChange={handleChange('startDate')}
          error={errors.startDate}
        />
        <TextField
          label="End date"
          type="date"
          name="endDate"
          optional
          min={values.startDate || undefined}
          value={values.endDate}
          onChange={handleChange('endDate')}
          error={errors.endDate}
        />
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {project ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}

export function ProjectFormModal({ open, project, onClose, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={project ? 'Edit project' : 'New project'}
      description={project ? 'Update the details of this project.' : 'Name your project and, optionally, set a timeline.'}
    >
      <ProjectForm project={project} onCancel={onClose} onSaved={onSaved} />
    </Modal>
  );
}
