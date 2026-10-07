import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';

export function ProgressBar({ value, label, height = 6, color = colors.primary }) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { height, borderRadius: height / 2 }]}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: 'rgba(255, 255, 255, 0.07)', overflow: 'hidden' },
  fill: { height: '100%' },
});
