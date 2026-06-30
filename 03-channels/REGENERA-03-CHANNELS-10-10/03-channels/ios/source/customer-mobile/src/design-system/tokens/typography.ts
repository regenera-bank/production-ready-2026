/**
 * @meta Domain: Mobile / Theme
 * @description Typography system for React Native.
 */

import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: '#A0A0A0',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
};
