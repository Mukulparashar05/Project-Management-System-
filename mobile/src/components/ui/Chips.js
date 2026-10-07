import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';

/** Single-choice chips; scrolls horizontally when the options do not fit. */
export function ChipGroup({ label, options, value, onChange, scrollable = true }) {
  const chips = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value || 'all'}
        onPress={() => onChange(option.value)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}: ${option.label}`}
        style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
      >
        <Text style={[styles.chipText, selected && styles.selectedText]}>{option.label}</Text>
      </Pressable>
    );
  });

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.groupLabel}>{label}</Text>
      {scrollable ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          keyboardShouldPersistTaps="handled"
        >
          {chips}
        </ScrollView>
      ) : (
        <View style={[styles.row, styles.wrap]}>{chips}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupLabel: { ...typography.caption, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 8 },
  wrap: { flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    minHeight: 36,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: 'rgba(129, 140, 248, 0.18)', borderColor: 'rgba(165, 180, 252, 0.6)' },
  pressed: { opacity: 0.8 },
  chipText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  selectedText: { color: colors.text },
});
