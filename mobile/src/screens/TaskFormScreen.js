import { useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { DateField } from '../components/ui/DateField';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { InlineMessage } from '../components/ui/StateViews';
import { Screen } from '../components/ui/Screen';
import { TextField } from '../components/ui/TextField';
import { taskService } from '../services/taskService';
import { priorityTones, statusTones } from '../theme';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../utils/constants';
import { showToast } from '../utils/feedback';
import { validateTask } from '../utils/validation';

/** Creates a task (route param projectId) or edits/deletes one (route param task). */
export function TaskFormScreen({ route, navigation }) {
  const { projectId, task } = route.params;
  const editing = Boolean(task);
  const insets = useSafeAreaInsets();

  const [values, setValues] = useState(() => ({
    name: task?.name ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? 'PENDING',
    dueDate: task?.dueDate ?? null,
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = saving || deleting;

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit task' : 'New task' });
  }, [navigation, editing]);

  const update = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  function showServerError(error) {
    const fieldErrors = error.fieldErrors ?? {};
    setErrors(fieldErrors);
    setFormError(Object.keys(fieldErrors).length > 0 ? null : error.message);
  }

  async function handleSave() {
    const validationErrors = validateTask(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.keys(validationErrors).length > 0) return;

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      priority: values.priority,
      status: values.status,
      dueDate: values.dueDate,
    };

    setSaving(true);
    try {
      if (editing) await taskService.update(task.id, payload);
      else await taskService.create({ ...payload, projectId });
      navigation.goBack();
      showToast(editing ? 'Task updated' : 'Task created');
    } catch (error) {
      showServerError(error);
      setSaving(false);
    }
  }

  async function deleteTask() {
    setDeleting(true);
    setFormError(null);
    try {
      await taskService.remove(task.id);
      navigation.goBack();
      showToast('Task deleted');
    } catch (error) {
      showServerError(error);
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete task?', `“${task.name}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteTask },
    ]);
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <InlineMessage message={formError} />
          <TextField
            label="Task name"
            value={values.name}
            onChangeText={update('name')}
            error={errors.name}
            placeholder="e.g. Write release notes"
            maxLength={160}
            autoFocus={!editing}
            returnKeyType="done"
          />
          <TextField
            label="Description"
            optional
            multiline
            value={values.description}
            onChangeText={update('description')}
            error={errors.description}
            placeholder="Add details or acceptance criteria"
            maxLength={2000}
          />
          <SegmentedControl
            label="Priority"
            options={TASK_PRIORITY_OPTIONS}
            value={values.priority}
            onChange={update('priority')}
            tones={priorityTones}
          />
          <SegmentedControl
            label="Status"
            options={TASK_STATUS_OPTIONS}
            value={values.status}
            onChange={update('status')}
            tones={statusTones}
          />
          <DateField label="Due date" value={values.dueDate} onChange={update('dueDate')} error={errors.dueDate} />

          <View style={styles.actions}>
            <Button title={editing ? 'Save changes' : 'Create task'} onPress={handleSave} loading={saving} disabled={busy} />
            {editing && (
              <Button
                title="Delete task"
                variant="danger"
                icon="trash-outline"
                onPress={confirmDelete}
                loading={deleting}
                disabled={busy}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 18, padding: 16 },
  actions: { gap: 12, marginTop: 8 },
});
