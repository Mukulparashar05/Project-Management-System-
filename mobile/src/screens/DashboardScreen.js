import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatCard } from '../components/dashboard/StatCard';
import { PriorityBadge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ErrorState, InlineMessage, LoadingState } from '../components/ui/StateViews';
import { Screen } from '../components/ui/Screen';
import { useApiResource } from '../hooks/useApiResource';
import { useAuth } from '../hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import { colors, radius, typography } from '../theme';
import { describeDueDate, greetingForTime, isTaskOverdue } from '../utils/dates';

const SEGMENTS = [
  { key: 'COMPLETED', label: 'Completed', color: colors.successStrong },
  { key: 'IN_PROGRESS', label: 'In progress', color: colors.primaryStrong },
  { key: 'PENDING', label: 'Pending', color: '#52525b' },
];

function CompletionCard({ stats, tasksByStatus }) {
  return (
    <Card>
      <View style={styles.completionHeader}>
        <View>
          <Text style={typography.heading}>Task completion</Text>
          <Text style={typography.caption}>Across all of your projects</Text>
        </View>
        <Text style={styles.completionValue} accessibilityLabel={`${stats.completionRate} percent complete`}>
          {stats.completionRate}
          <Text style={styles.percentSign}>%</Text>
        </Text>
      </View>
      <View style={styles.segmentTrack}>
        {stats.totalTasks > 0 &&
          SEGMENTS.map(({ key, color }) =>
            tasksByStatus[key] > 0 ? (
              <View key={key} style={{ flex: tasksByStatus[key], backgroundColor: color, borderRadius: 4 }} />
            ) : null,
          )}
      </View>
      <View style={styles.legend}>
        {SEGMENTS.map(({ key, label, color }) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={typography.caption}>
              {label} · <Text style={styles.legendCount}>{tasksByStatus[key]}</Text>
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function UpcomingTasks({ tasks, onOpenProject }) {
  return (
    <Card>
      <Text style={typography.heading}>Up next</Text>
      <Text style={[typography.caption, styles.sectionHint]}>Open tasks with the nearest due dates</Text>
      {tasks.length === 0 ? (
        <Text style={typography.muted}>No upcoming deadlines. Tasks with a due date appear here.</Text>
      ) : (
        tasks.map((task, index) => (
          <Pressable
            key={task.id}
            onPress={() => onOpenProject(task.project)}
            accessibilityRole="button"
            accessibilityLabel={`${task.name} in ${task.project.name}, ${describeDueDate(task.dueDate)}`}
            style={({ pressed }) => [styles.upcomingRow, index > 0 && styles.upcomingDivider, pressed && styles.pressed]}
          >
            <View style={styles.upcomingText}>
              <Text style={styles.upcomingName} numberOfLines={1}>
                {task.name}
              </Text>
              <Text style={typography.caption} numberOfLines={1}>
                {task.project.name} ·{' '}
                <Text style={isTaskOverdue(task) && styles.overdue}>{describeDueDate(task.dueDate)}</Text>
              </Text>
            </View>
            <PriorityBadge priority={task.priority} />
          </Pressable>
        ))
      )}
    </Card>
  );
}

export function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { data, error, isLoading, refreshing, refresh, reload } = useApiResource(() => dashboardService.get(), []);

  if (isLoading) {
    return (
      <Screen edges={['top']}>
        <LoadingState label="Loading your dashboard…" />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen edges={['top']}>
        <ErrorState error={error} title="Couldn’t load your dashboard" onRetry={reload} />
      </Screen>
    );
  }

  const { stats, tasksByStatus, upcomingTasks } = data;
  const openProject = (project) =>
    navigation.navigate('ProjectDetail', { projectId: project.id, projectName: project.name });

  return (
    <Screen edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primaryStrong]}
            progressBackgroundColor={colors.surfaceRaised}
          />
        }
      >
        <InlineMessage message={error?.message} style={styles.refreshError} />
        <Text style={typography.eyebrow}>OVERVIEW</Text>
        <Text style={[typography.title, styles.greeting]} accessibilityRole="header">
          {greetingForTime()}, {user.fullName.split(' ')[0]}
        </Text>
        <Text style={[typography.muted, styles.subtitle]}>Pull down to refresh your latest numbers.</Text>

        <View style={styles.grid}>
          <StatCard label="Total projects" value={stats.totalProjects} icon="folder-outline" tint="#818cf8" />
          <StatCard label="Total tasks" value={stats.totalTasks} icon="list-outline" tint="#38bdf8" />
          <StatCard
            label="Completed tasks"
            value={stats.completedTasks}
            icon="checkmark-done-outline"
            tint="#34d399"
            hint={`${stats.completionRate}% of all tasks`}
          />
          <StatCard
            label="Pending tasks"
            value={stats.pendingTasks}
            icon="hourglass-outline"
            tint="#fbbf24"
            hint={`${stats.inProgressTasks} more in progress`}
          />
          <StatCard
            label="Projects in progress"
            value={stats.projectsInProgress}
            icon="pulse-outline"
            tint="#a78bfa"
            style={styles.fullWidth}
          />
        </View>

        <CompletionCard stats={stats} tasksByStatus={tasksByStatus} />
        <View style={styles.gap} />
        <UpcomingTasks tasks={upcomingTasks} onOpenProject={openProject} />

        {stats.totalProjects === 0 && (
          <View style={styles.hintCard}>
            <Ionicons name="desktop-outline" size={18} color={colors.primary} />
            <Text style={[typography.muted, styles.hintText]}>
              No projects yet. Create one in the Orbit web app and pull down to refresh.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  refreshError: { marginBottom: 16 },
  greeting: { marginTop: 6 },
  subtitle: { marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  fullWidth: { flexBasis: '100%' },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  completionValue: { fontSize: 34, fontWeight: '700', letterSpacing: -1, color: colors.text },
  percentSign: { fontSize: 20, color: colors.textSubtle },
  segmentTrack: {
    flexDirection: 'row',
    gap: 4,
    height: 10,
    marginTop: 16,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendCount: { color: colors.text, fontWeight: '600' },
  gap: { height: 16 },
  sectionHint: { marginTop: 2, marginBottom: 10 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  upcomingDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
  upcomingText: { flex: 1, gap: 2 },
  upcomingName: { fontSize: 15, fontWeight: '600', color: colors.text },
  overdue: { color: colors.danger },
  pressed: { opacity: 0.7 },
  hintCard: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.3)',
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
  },
  hintText: { flex: 1 },
});
