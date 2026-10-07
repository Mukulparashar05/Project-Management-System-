import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';
import { Button } from './Button';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[typography.muted, styles.loadingText]}>{label}</Text>
    </View>
  );
}

export function ErrorState({ error, title, onRetry }) {
  const offline = error?.isConnectivityError;
  return (
    <View style={styles.centered} accessibilityRole="alert">
      <View style={[styles.iconBubble, styles.errorBubble]}>
        <Ionicons
          name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={26}
          color={offline ? colors.warning : colors.danger}
        />
      </View>
      <Text style={[typography.heading, styles.title]}>
        {title ?? (offline ? 'You’re offline' : 'Something went wrong')}
      </Text>
      <Text style={[typography.muted, styles.message]}>{error?.message}</Text>
      {onRetry && <Button title="Try again" icon="refresh" variant="secondary" onPress={onRetry} style={styles.action} />}
    </View>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <View style={styles.empty}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[typography.heading, styles.title]}>{title}</Text>
      {message && <Text style={[typography.muted, styles.message]}>{message}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const messageTones = {
  error: { icon: 'alert-circle-outline', color: colors.danger, background: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)' },
  warning: { icon: 'time-outline', color: colors.warning, background: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.3)' },
  info: { icon: 'information-circle-outline', color: colors.primary, background: 'rgba(129, 140, 248, 0.1)', border: 'rgba(129, 140, 248, 0.3)' },
};

/** Inline banner for form-level or screen-level messages. */
export function InlineMessage({ tone = 'error', message, style }) {
  if (!message) return null;
  const { icon, color, background, border } = messageTones[tone];
  return (
    <View
      accessible
      style={[styles.inline, { backgroundColor: background, borderColor: border }, style]}
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.inlineText, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 14 },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.25)',
  },
  errorBubble: { backgroundColor: 'rgba(244, 63, 94, 0.08)', borderColor: 'rgba(244, 63, 94, 0.25)' },
  title: { marginTop: 16, textAlign: 'center' },
  message: { marginTop: 6, textAlign: 'center', maxWidth: 320 },
  action: { marginTop: 20 },
  inline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  inlineText: { flex: 1, fontSize: 14, lineHeight: 20 },
});
