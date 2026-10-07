import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useNetwork } from '../../hooks/useNetwork';
import { colors, radius } from '../../theme';
import { NO_CONNECTION_MESSAGE } from '../../utils/constants';

export function OfflineBanner() {
  const { isOffline } = useNetwork();
  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <Text style={styles.text}>{NO_CONNECTION_MESSAGE}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  text: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.warning },
});
