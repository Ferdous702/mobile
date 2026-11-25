import { Platform } from 'react-native';

export const colors = {
  // Brand — deep teal with a warm amber accent
  primary: '#0F766E',
  primaryDark: '#0B5A54',
  primaryLight: '#E6F4F2',
  primarySoft: '#CCEBE6',
  accent: '#F59E0B',
  accentLight: '#FEF3C7',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Neutral
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F6',
  border: '#E3E6EB',
  borderStrong: '#CBD2DB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  overlay: 'rgba(17, 24, 39, 0.55)',
};

export const typography = {
  display: { fontSize: 30, fontWeight: '800', lineHeight: 36, letterSpacing: -0.5 },
  h1: { fontSize: 26, fontWeight: '800', lineHeight: 32, letterSpacing: -0.3 },
  h2: { fontSize: 21, fontWeight: '700', lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  button: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Cross-platform shadows (boxShadow on web avoids the deprecated shadow* warnings)
const makeShadow = (y, blur, opacity, elevation) =>
  Platform.select({
    web: { boxShadow: `0px ${y}px ${blur}px rgba(17, 24, 39, ${opacity})` },
    default: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: y },
      shadowOpacity: opacity,
      shadowRadius: blur / 2,
      elevation,
    },
  });

export const shadow = {
  sm: makeShadow(1, 3, 0.06, 1),
  md: makeShadow(4, 12, 0.08, 3),
  lg: makeShadow(8, 24, 0.12, 6),
};

// Max width for content on wide screens (web / tablets)
export const CONTENT_MAX_WIDTH = 720;

export default { colors, typography, spacing, radius, shadow };
