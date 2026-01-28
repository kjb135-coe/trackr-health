import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
} as const;
