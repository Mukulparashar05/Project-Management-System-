import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, typography } from '../../theme';

export function TextField({
  ref,
  label,
  error,
  hint,
  optional = false,
  secure = false,
  multiline = false,
  style,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={style}>
      <View style={styles.labelRow}>
        <Text style={typography.label}>{label}</Text>
        {optional && <Text style={typography.caption}>Optional</Text>}
      </View>
      <View
        style={[
          styles.inputShell,
          multiline && styles.multilineShell,
          focused && styles.focused,
          error && styles.invalid,
        ]}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          secureTextEntry={secure && !revealed}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && styles.multilineInput]}
          {...inputProps}
        />
        {secure && (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={styles.revealButton}
          >
            <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        hint && <Text style={styles.hint}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
  },
  multilineShell: { alignItems: 'flex-start' },
  focused: { borderColor: 'rgba(165, 180, 252, 0.7)' },
  invalid: { borderColor: 'rgba(253, 164, 175, 0.75)' },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
  multilineInput: { minHeight: 104 },
  revealButton: { paddingHorizontal: 14, alignSelf: 'stretch', justifyContent: 'center' },
  error: { marginTop: 6, fontSize: 12, lineHeight: 16, color: colors.danger },
  hint: { marginTop: 6, ...typography.caption },
});
