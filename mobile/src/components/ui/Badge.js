import { StyleSheet, Text, View } from 'react-native';
import { priorityTones, statusTones } from '../../theme';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../utils/constants';

export function Badge({ label, tone }) {
  return (
    <View style={[styles.badge, { backgroundColor: tone.background, borderColor: tone.border }]}>
      <View style={[styles.dot, { backgroundColor: tone.text }]} />
      <Text style={[styles.text, { color: tone.text }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }) {
  return <Badge label={STATUS_LABELS[status]} tone={statusTones[status]} />;
}

export function PriorityBadge({ priority }) {
  return <Badge label={`${PRIORITY_LABELS[priority]} priority`} tone={priorityTones[priority]} />;
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 12, fontWeight: '600' },
});
