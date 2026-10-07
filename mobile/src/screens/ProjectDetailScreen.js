import Ionicons from '@expo/vector-icons/Ionicons';
import { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskRow } from '../components/tasks/TaskRow';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ChipGroup } from '../components/ui/Chips';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState, ErrorState, InlineMessage, LoadingState } from '../components/ui/StateViews';
import { Screen } from '../components/ui/Screen';
import { useApiResource } from '../hooks/useApiResource';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { colors, radius, typography } from '../theme';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS, withAllOption } from '../utils/constants';
import { formatDateRange } from '../utils/dates';
import { showToast } from '../utils/feedback';

const STATUS_FILTERS = withAllOption(TASK_STATUS_OPTIONS);
const PRIORITY_FILTERS = withAllOption(TASK_PRIORITY_OPTIONS);

function Separator() {
  return <View style={styles.separator} />;
}

function ProjectSummary({ project }) {
  const { taskCounts } = project;
  return (
    <Card style={styles.summary}>
      <StatusBadge status={project.status} />
      <Text style={[typography.title, styles.projectName]} accessibilityRole="header">
        {project.name}
      </Text>
      <Text style={[typography.muted, !project.description && styles.placeholder]}>
        {project.description || 'No description'}
      </Text>
      <View style={styles.timeline}>
        <Ionicons name="calendar-outline" size={14} color={colors.textSubtle} />
        <Text style={typography.caption}>{formatDateRange(project.startDate, project.endDate)}</Text>
      </View>
      <View style={styles.progressRow}>
        <Text style={typography.caption}>
          {taskCounts.completed} of {taskCounts.total} {taskCounts.total === 1 ? 'task' : 'tasks'} completed
        </Text>
        <Text style={styles.percent}>{project.progress}%</Text>
      </View>
      <ProgressBar value={project.progress} label="Project progress" height={8} />
    </Card>
  );
}

export function ProjectDetailScreen({ route, navigation }) {
  const { projectId, projectName } = route.params;
  const insets = useSafeAreaInsets();

  const projectQuery = useApiResource(() => projectService.get(projectId), [projectId]);
  const project = projectQuery.data;

  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const search = useDebouncedValue(searchText.trim());
  const tasksQuery = useApiResource(
    () => taskService.list({ projectId, search, status, priority }),
    [projectId, search, status, priority],
  );
  const tasks = tasksQuery.data;
  const [busyTaskIds, setBusyTaskIds] = useState(() => new Set());
  const filtersActive = Boolean(search || status || priority);

  useLayoutEffect(() => {
    navigation.setOptions({ title: project?.name ?? projectName ?? 'Project' });
  }, [navigation, project?.name, projectName]);

  function setTaskBusy(taskId, busy) {
    setBusyTaskIds((current) => {
      const next = new Set(current);
      if (busy) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }

  async function toggleComplete(task) {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setTaskBusy(task.id, true);
    try {
      const updated = await taskService.update(task.id, { status: nextStatus });
      tasksQuery.setData((current) => current?.map((item) => (item.id === updated.id ? updated : item)));
      // Re-query so active filters and the progress summary reflect the change.
      tasksQuery.reload();
      projectQuery.reload();
      showToast(nextStatus === 'COMPLETED' ? 'Task completed' : 'Task reopened');
    } catch (error) {
      Alert.alert('Couldn’t update the task', error.message);
    } finally {
      setTaskBusy(task.id, false);
    }
  }

  function refreshAll() {
    projectQuery.refresh();
    tasksQuery.refresh();
  }

  if (projectQuery.isLoading) {
    return (
      <Screen>
        <LoadingState label="Loading project…" />
      </Screen>
    );
  }

  if (projectQuery.error?.status === 404) {
    return (
      <Screen>
        <View style={styles.centered}>
          <EmptyState
            icon="folder-open-outline"
            title="Project not found"
            message="It may have been deleted on another device, or it belongs to another account."
            action={<Button title="Back to projects" variant="secondary" compact onPress={() => navigation.goBack()} />}
          />
        </View>
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen>
        <ErrorState error={projectQuery.error} title="Couldn’t load this project" onRetry={projectQuery.reload} />
      </Screen>
    );
  }

  let emptyContent;
  if (tasksQuery.isLoading) emptyContent = <LoadingState label="Loading tasks…" />;
  else if (!tasks) emptyContent = <ErrorState error={tasksQuery.error} title="Couldn’t load tasks" onRetry={tasksQuery.reload} />;
  else if (filtersActive) {
    emptyContent = (
      <EmptyState
        icon="search-outline"
        title="No tasks match"
        message="Try another search, status or priority."
        action={
          <Button
            title="Clear filters"
            variant="secondary"
            compact
            onPress={() => {
              setSearchText('');
              setStatus('');
              setPriority('');
            }}
          />
        }
      />
    );
  } else {
    emptyContent = (
      <EmptyState
        icon="clipboard-outline"
        title="No tasks yet"
        message="Add the first task to start tracking progress."
        action={
          <Button title="Add task" icon="add" compact onPress={() => navigation.navigate('TaskForm', { projectId })} />
        }
      />
    );
  }

  const header = (
    <View style={styles.header}>
      <InlineMessage message={projectQuery.error?.message} />
      <ProjectSummary project={project} />
      <View style={styles.tasksHeading}>
        <Text style={typography.heading}>Tasks</Text>
        <View style={styles.countRow}>
          {tasksQuery.isUpdating && <ActivityIndicator size="small" color={colors.primary} />}
          {tasks && (
            <Text style={typography.caption}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              {filtersActive ? ' match' : ''}
            </Text>
          )}
        </View>
      </View>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search tasks"
        accessibilityLabel="Search tasks by name"
      />
      <ChipGroup label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
      <ChipGroup label="Priority" options={PRIORITY_FILTERS} value={priority} onChange={setPriority} />
      {tasks && <InlineMessage message={tasksQuery.error?.message} />}
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={tasks ?? []}
        keyExtractor={(task) => task.id}
        renderItem={({ item }) => (
          <TaskRow
            task={item}
            busy={busyTaskIds.has(item.id)}
            onToggleComplete={() => toggleComplete(item)}
            onPress={() => navigation.navigate('TaskForm', { projectId, task: item })}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyContent}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
        keyboardShouldPersistTaps="handled"
        testID="tasks-list"
        refreshControl={
          <RefreshControl
            refreshing={projectQuery.refreshing || tasksQuery.refreshing}
            onRefresh={refreshAll}
            tintColor={colors.primary}
            colors={[colors.primaryStrong]}
            progressBackgroundColor={colors.surfaceRaised}
          />
        }
      />
      <Pressable
        onPress={() => navigation.navigate('TaskForm', { projectId })}
        accessibilityRole="button"
        accessibilityLabel="New task"
        style={({ pressed }) => [styles.fab, { bottom: insets.bottom + 20 }, pressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={22} color={colors.onPrimary} />
        <Text style={styles.fabText}>New task</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', padding: 16 },
  header: { gap: 14, marginBottom: 16 },
  summary: { gap: 8 },
  projectName: { marginTop: 6 },
  placeholder: { color: colors.textSubtle },
  timeline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  percent: { fontSize: 13, fontWeight: '700', color: colors.text },
  tasksHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  separator: { height: 10 },
  fab: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    elevation: 6,
    shadowColor: '#818cf8',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  fabPressed: { opacity: 0.85 },
  fabText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
});
