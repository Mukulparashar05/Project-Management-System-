import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';
import { formatDateRange } from '../../utils/dates';
import { StatusBadge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

export function ProjectCard({ project, onPress }) {
  const { taskCounts } = project;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${project.name}, ${project.progress}% complete. Open project`}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.06)' }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <StatusBadge status={project.status} />
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      </View>
      <Text style={[typography.heading, styles.name]} numberOfLines={2}>
        {project.name}
      </Text>
      <Text style={[typography.muted, !project.description && styles.placeholder]} numberOfLines={2}>
        {project.description || 'No description'}
      </Text>
      <View style={styles.dates}>
        <Ionicons name="calendar-outline" size={14} color={colors.textSubtle} />
        <Text style={typography.caption}>{formatDateRange(project.startDate, project.endDate)}</Text>
      </View>
      <View style={styles.progressRow}>
        <Text style={typography.caption}>
          {taskCounts.completed} of {taskCounts.total} {taskCounts.total === 1 ? 'task' : 'tasks'} done
        </Text>
        <Text style={styles.percent}>{project.progress}%</Text>
      </View>
      <ProgressBar value={project.progress} label={`${project.name} progress`} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { marginTop: 12, marginBottom: 4 },
  placeholder: { color: colors.textSubtle },
  dates: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  percent: { fontSize: 12, fontWeight: '600', color: colors.text },
});
