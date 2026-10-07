import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

const variants = {
  primary: { container: { backgroundColor: colors.white }, text: { color: colors.onPrimary } },
  secondary: {
    container: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.borderStrong },
    text: { color: colors.text },
  },
  ghost: { container: { backgroundColor: 'transparent' }, text: { color: colors.primary } },
  danger: {
    container: { backgroundColor: 'rgba(244, 63, 94, 0.12)', borderWidth: 1, borderColor: 'rgba(244, 63, 94, 0.4)' },
    text: { color: colors.danger },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityLabel,
}) {
  const { container, text } = variants[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.12)' }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        container,
        pressed && styles.pressed,
        inactive && styles.inactive,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={text.color} />
        ) : (
          icon && <Ionicons name={icon} size={compact ? 16 : 18} color={text.color} />
        )}
        <Text style={[styles.text, compact && styles.compactText, text]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  compact: { minHeight: 40, paddingHorizontal: 14 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { fontSize: 15, fontWeight: '600' },
  compactText: { fontSize: 14 },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.55 },
});
