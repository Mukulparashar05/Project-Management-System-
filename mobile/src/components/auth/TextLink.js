import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme';

export function TextLink({ prefix, label, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" accessibilityLabel={label} hitSlop={8}>
      <Text style={styles.prefix}>
        {prefix} <Text style={styles.link}>{label}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  prefix: { fontSize: 14, color: colors.textMuted },
  link: { fontWeight: '600', color: colors.primary },
});
