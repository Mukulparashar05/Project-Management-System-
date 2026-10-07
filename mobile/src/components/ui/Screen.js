import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { OfflineBanner } from './OfflineBanner';

/**
 * Root container for every screen: themed background, safe-area padding for the given edges
 * and the offline banner, so connectivity problems are visible everywhere.
 */
export function Screen({ children, edges = [], style }) {
  const Container = edges.length > 0 ? SafeAreaView : View;
  return (
    <Container edges={edges} style={[styles.screen, style]}>
      <OfflineBanner />
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
