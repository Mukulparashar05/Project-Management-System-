import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Screen } from '../components/ui/Screen';
import { API_URL } from '../config';
import { useAuth } from '../hooks/useAuth';
import { colors, typography } from '../theme';
import { formatTimestamp } from '../utils/dates';

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={colors.textSubtle} />
      <View style={styles.infoText}>
        <Text style={typography.caption}>{label}</Text>
        <Text style={typography.body} selectable>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function AccountScreen() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  function confirmLogout() {
    Alert.alert('Log out?', 'You will need to sign in again on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={typography.eyebrow}>ACCOUNT</Text>
        <Text style={[typography.title, styles.title]} accessibilityRole="header">
          Your profile
        </Text>

        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(user.fullName)}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={typography.heading}>{user.fullName}</Text>
            <Text style={typography.muted}>{user.email}</Text>
          </View>
        </Card>

        <Card style={styles.details}>
          <InfoRow icon="time-outline" label="Member since" value={formatTimestamp(user.createdAt)} />
          <InfoRow icon="server-outline" label="Connected API" value={API_URL} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="Session security"
            value="Your sign-in token is encrypted in this device's secure keystore."
          />
        </Card>

        <Button
          title="Log out"
          variant="danger"
          icon="log-out-outline"
          onPress={confirmLogout}
          loading={loggingOut}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  title: { marginTop: -10 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(165, 180, 252, 0.35)',
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: colors.primary },
  profileText: { flex: 1, gap: 2 },
  details: { gap: 16 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoText: { flex: 1, gap: 2 },
});
