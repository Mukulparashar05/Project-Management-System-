import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

/** The Orbit mark (planet, tilted ring and moon) drawn with plain views, no SVG dependency. */
export function LogoMark({ size = 40 }) {
  const scale = size / 64;
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: 16 * scale }]} accessible={false}>
      <View
        style={[
          styles.ring,
          { width: 44 * scale, height: 18 * scale, borderRadius: 22 * scale, borderWidth: Math.max(1.5, 3 * scale) },
        ]}
      />
      <View style={[styles.planet, { width: 18 * scale, height: 18 * scale, borderRadius: 9 * scale }]} />
      <View
        style={[
          styles.moon,
          { width: 7 * scale, height: 7 * scale, borderRadius: 3.5 * scale, top: 18.5 * scale, right: 9.5 * scale },
        ]}
      />
    </View>
  );
}

export function Wordmark() {
  return (
    <View style={styles.wordmark}>
      <LogoMark size={36} />
      <Text style={styles.name}>Orbit</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0e1118',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  ring: { position: 'absolute', borderColor: '#a5b4fc', transform: [{ rotate: '-28deg' }] },
  planet: { backgroundColor: '#8fb8fb' },
  moon: { position: 'absolute', backgroundColor: colors.accent },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 19, fontWeight: '700', letterSpacing: -0.4, color: colors.text },
});
