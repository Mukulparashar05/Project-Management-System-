import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../theme';
import { Wordmark } from '../brand/LogoMark';
import { Screen } from '../ui/Screen';

/** Shared layout for the login and register screens. */
export function AuthScaffold({ title, highlight, description, children, footer }) {
  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Wordmark />
          <View style={styles.hero}>
            <Text style={typography.display} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.highlight}>{highlight}</Text>
            <Text style={[typography.muted, styles.description]}>{description}</Text>
          </View>
          {children}
          <View style={styles.footer}>{footer}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 },
  hero: { marginTop: 40, marginBottom: 28 },
  highlight: {
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 36,
    lineHeight: 44,
    color: colors.primary,
  },
  description: { marginTop: 14, fontSize: 15, lineHeight: 22 },
  footer: { marginTop: 'auto', paddingTop: 28, alignItems: 'center' },
});
