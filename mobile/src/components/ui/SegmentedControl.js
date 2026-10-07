import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';

/** Equal-width options for form fields such as task status and priority. */
export function SegmentedControl({ label, options, value, onChange, tones }) {
  return (
    <View>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value;
          const tone = tones?.[option.value];
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}: ${option.label}`}
              style={[
                styles.segment,
                selected && styles.selected,
                selected && tone && { backgroundColor: tone.background, borderColor: tone.border },
              ]}
            >
              <Text style={[styles.text, selected && { color: tone?.text ?? colors.text }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8 },
  track: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selected: { backgroundColor: colors.surfaceRaised, borderColor: colors.borderStrong },
  text: { fontSize: 13, fontWeight: '600', color: colors.textSubtle },
});
