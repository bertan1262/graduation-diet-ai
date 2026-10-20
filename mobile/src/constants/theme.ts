import { TextStyle, ViewStyle } from 'react-native';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography: Record<string, TextStyle> = {
  display: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  tiny: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
};

export const Shadows: Record<string, ViewStyle> = {
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
};
