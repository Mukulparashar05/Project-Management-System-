import { DarkTheme } from '@react-navigation/native';

// Mirrors the web app's palette so both clients feel like one product.
export const colors = {
  background: '#06070b',
  surface: '#0e1118',
  surfaceRaised: '#141824',
  input: '#10131b',
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  text: '#f4f4f5',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',
  primary: '#a5b4fc',
  primaryStrong: '#6366f1',
  accent: '#67e8f9',
  success: '#6ee7b7',
  successStrong: '#34d399',
  warning: '#fcd34d',
  danger: '#fda4af',
  dangerStrong: '#f43f5e',
  onPrimary: '#06070b',
  white: '#fafafa',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, full: 999 };

export const typography = {
  display: { fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1, color: colors.text },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6, color: colors.text },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, lineHeight: 21, color: colors.text },
  muted: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  caption: { fontSize: 12, lineHeight: 16, color: colors.textSubtle },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.text },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1.6, color: colors.primary },
};

const neutralTone = { text: '#d4d4d8', background: 'rgba(161, 161, 170, 0.12)', border: 'rgba(161, 161, 170, 0.28)' };

export const statusTones = {
  NOT_STARTED: neutralTone,
  PENDING: neutralTone,
  IN_PROGRESS: { text: '#c7d2fe', background: 'rgba(129, 140, 248, 0.14)', border: 'rgba(129, 140, 248, 0.35)' },
  COMPLETED: { text: '#6ee7b7', background: 'rgba(52, 211, 153, 0.12)', border: 'rgba(52, 211, 153, 0.35)' },
};

export const priorityTones = {
  LOW: neutralTone,
  MEDIUM: { text: '#fcd34d', background: 'rgba(251, 191, 36, 0.12)', border: 'rgba(251, 191, 36, 0.35)' },
  HIGH: { text: '#fda4af', background: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)' },
};

export const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.primaryStrong,
  },
};
