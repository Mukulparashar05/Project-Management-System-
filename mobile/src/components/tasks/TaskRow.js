import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';
import { describeDueDate, formatCalendarDate, isTaskOverdue } from '../../utils/dates';
import { PriorityBadge, StatusBadge } from '../ui/Badge';

export function TaskRow({ task, busy, onToggleComplete, onPress }) {
  const completed = task.status === 'COMPLETED';
  const overdue = isTaskOverdue(task);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${task.name}. Edit task`}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.06)' }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, busy && styles.busy]}
    >
      <Pressable
        onPress={onToggleComplete}
        disabled={busy}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed, busy, disabled: busy }}
        accessibilityLabel={completed ? `Mark ${task.name} as not completed` : `Mark ${task.name} as completed`}
        style={[styles.checkbox, completed && styles.checkboxChecked]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={completed ? colors.onPrimary : colors.primary} />
        ) : (
          completed && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
        )}
      </Pressable>

      <View style={styles.body}>
        <Text style={[styles.name, completed && styles.nameCompleted]}>{task.name}</Text>
        {task.description ? (
          <Text style={typography.muted} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <View style={styles.badges}>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </View>
        {task.dueDate && (
          <View style={styles.due}>
            <Ionicons name="calendar-outline" size={13} color={overdue ? colors.danger : colors.textSubtle} />
            <Text style={[typography.caption, overdue && styles.overdue]}>
              {completed ? `Due ${formatCalendarDate(task.dueDate)}` : describeDueDate(task.dueDate)}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  busy: { opacity: 0.7 },
  checkbox: {
    width: 26,
    height: 26,
    marginTop: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.successStrong, borderColor: colors.successStrong },
  body: { flex: 1, gap: 6 },
  name: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: colors.text },
  nameCompleted: { color: colors.textSubtle, textDecorationLine: 'line-through' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  due: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  overdue: { color: colors.danger },
  chevron: { marginTop: 3 },
});
