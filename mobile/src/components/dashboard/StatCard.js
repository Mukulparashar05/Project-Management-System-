import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';

export function StatCard({ label, value, icon, tint, hint, style }) {
  return (
    <View style={[styles.card, style]} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={styles.header}>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        <View style={[styles.icon, { backgroundColor: `${tint}1f`, borderColor: `${tint}40` }]}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      {hint && <Text style={typography.caption}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 118,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  label: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  icon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { marginTop: 12, marginBottom: 2, fontSize: 30, fontWeight: '700', letterSpacing: -0.8, color: colors.text },
});
