export const colors = {
  background: '#020617',
  card: '#071225',
  cardBorder: 'rgba(125, 211, 252, 0.12)',
  border: 'rgba(148, 163, 184, 0.16)',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  cyan: '#22d3ee',
  cyanDim: 'rgba(34, 211, 238, 0.10)',
  cyanBorder: 'rgba(34, 211, 238, 0.28)',
  indigo: '#60a5fa',
  indigoDim: 'rgba(96, 165, 250, 0.10)',
  indigoBorder: 'rgba(96, 165, 250, 0.26)',
  emerald: '#38bdf8',
  emeraldDim: 'rgba(56, 189, 248, 0.10)',
  red: '#93c5fd',
  redDim: 'rgba(37, 99, 235, 0.12)',
  amber: '#bfdbfe',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textDim },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textDim,
    letterSpacing: 1,
  },
} as const;
