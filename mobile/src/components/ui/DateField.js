import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';
import { formatCalendarDate, fromCalendarDate, toCalendarDate } from '../../utils/dates';

/** Optional calendar date stored as "YYYY-MM-DD", picked with the platform's native picker. */
export function DateField({ label, value, onChange, error }) {
  const [showIosPicker, setShowIosPicker] = useState(false);
  const pickerValue = value ? fromCalendarDate(value) : new Date();

  function handlePicked(event, selectedDate) {
    setShowIosPicker(false);
    if (event.type === 'set' && selectedDate) onChange(toCalendarDate(selectedDate));
  }

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: pickerValue, mode: 'date', onChange: handlePicked });
    } else {
      setShowIosPicker(true);
    }
  }

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={typography.label}>{label}</Text>
        <Text style={typography.caption}>Optional</Text>
      </View>
      <View style={styles.row}>
        <Pressable
          onPress={openPicker}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatCalendarDate(value) : 'not set'}. Choose date`}
          style={({ pressed }) => [styles.field, error && styles.invalid, pressed && styles.pressed]}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.value, !value && styles.placeholder]}>
            {value ? formatCalendarDate(value) : 'No due date'}
          </Text>
        </Pressable>
        {value && (
          <Pressable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label.toLowerCase()}`}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <Text style={styles.clearText}>Clear</Text>
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {showIosPicker && <DateTimePicker value={pickerValue} mode="date" display="inline" onChange={handlePicked} />}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  invalid: { borderColor: 'rgba(253, 164, 175, 0.75)' },
  pressed: { opacity: 0.8 },
  value: { fontSize: 15, color: colors.text },
  placeholder: { color: colors.textSubtle },
  clear: {
    minHeight: 50,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  error: { marginTop: 6, fontSize: 12, color: colors.danger },
});
