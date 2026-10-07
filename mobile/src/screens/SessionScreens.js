import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LogoMark } from '../components/brand/LogoMark';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/StateViews';
import { Screen } from '../components/ui/Screen';
import { useAuth } from '../hooks/useAuth';
import { colors, typography } from '../theme';

export function SessionLoadingScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel="Restoring your session">
        <LogoMark size={64} />
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
        <Text style={typography.muted}>Restoring your session…</Text>
      </View>
    </Screen>
  );
}

/** Shown when a saved session exists but the API could not be reached to verify it. */
export function SessionUnverifiedScreen() {
  const { sessionError, restoreSession, endSession } = useAuth();
  return (
    <Screen edges={['top', 'bottom']}>
      <ErrorState error={sessionError} title="Can’t verify your session" onRetry={restoreSession} />
      <View style={styles.signOut}>
        <Button title="Sign out" variant="ghost" onPress={() => endSession()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  spinner: { marginTop: 12 },
  signOut: { paddingBottom: 24, alignItems: 'center' },
});
