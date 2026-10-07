import { Component } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../theme';
import { Button } from './ui/Button';

/** Last line of defence: an unexpected render error shows a recovery screen instead of a crash. */
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container} accessibilityRole="alert">
        <Text style={typography.title}>Something went wrong</Text>
        <Text style={[typography.muted, styles.message]}>
          The app hit an unexpected problem. Your data is safe on the server.
        </Text>
        <Button title="Reload" icon="refresh" onPress={() => this.setState({ hasError: false })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  message: { marginTop: 10, marginBottom: 24 },
});
