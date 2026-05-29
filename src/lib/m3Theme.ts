// Centralized Material Design 3 (M3) Design System Specifications
// Strictly follows the Google Material Design 3 Guidelines

export type ThemeMode = 'light' | 'dark';

export interface M3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

// Light color scheme based on Indigo/Violet primary
export const m3LightScheme: M3ColorScheme = {
  primary: '#4F46E5', // Indigo-600
  onPrimary: '#FFFFFF',
  primaryContainer: '#E0E0FF',
  onPrimaryContainer: '#0F0060',
  secondary: '#5B5D72',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E0E1F9',
  onSecondaryContainer: '#181A2C',
  tertiary: '#7B5264',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E6',
  onTertiaryContainer: '#301120',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#F8F9FA',
  onBackground: '#1A1C1E',
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#E1E2EC',
  onSurfaceVariant: '#44464F',
  outline: '#757780',
  outlineVariant: '#C5C6D0',
  inverseSurface: '#2F3033',
  inverseOnSurface: '#F1F0F4',
  inversePrimary: '#BAC3FF',
};

// Dark color scheme with low-ambient background to align with dark theme specs and high readability
export const m3DarkScheme: M3ColorScheme = {
  primary: '#BAC3FF',
  onPrimary: '#111441',
  primaryContainer: '#372FBA',
  onPrimaryContainer: '#E0E0FF',
  secondary: '#C4C5DD',
  onSecondary: '#2D2F42',
  secondaryContainer: '#444559',
  onSecondaryContainer: '#E0E1F9',
  tertiary: '#EBA1C1',
  onTertiary: '#482535',
  tertiaryContainer: '#613B4C',
  onTertiaryContainer: '#FFD8E6',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#09090b',
  onBackground: '#E2E2E6',
  surface: '#121214',
  onSurface: '#E2E2E6',
  surfaceVariant: '#44464F',
  onSurfaceVariant: '#C5C6D0',
  outline: '#8F909A',
  outlineVariant: '#44464F',
  inverseSurface: '#E2E2E6',
  inverseOnSurface: '#1A1C1E',
  inversePrimary: '#4F46E5',
};

export interface TypographyStyle {
  fontSize: string;
  fontWeight: number | string;
  lineHeight: string;
  letterSpacing?: string;
  textTransform?: string;
}

export interface M3TypographyScale {
  displayLarge: TypographyStyle;
  displayMedium: TypographyStyle;
  displaySmall: TypographyStyle;
  headlineLarge: TypographyStyle;
  headlineMedium: TypographyStyle;
  headlineSmall: TypographyStyle;
  titleLarge: TypographyStyle;
  titleMedium: TypographyStyle;
  titleSmall: TypographyStyle;
  bodyLarge: TypographyStyle;
  bodyMedium: TypographyStyle;
  bodySmall: TypographyStyle;
  labelLarge: TypographyStyle;
  labelMedium: TypographyStyle;
  labelSmall: TypographyStyle;
}

export const m3TypographyScale: M3TypographyScale = {
  displayLarge: {
    fontSize: '57px',
    fontWeight: 400,
    lineHeight: '64px',
    letterSpacing: '-0.25px',
  },
  displayMedium: {
    fontSize: '45px',
    fontWeight: 400,
    lineHeight: '52px',
    letterSpacing: '0px',
  },
  displaySmall: {
    fontSize: '36px',
    fontWeight: 400,
    lineHeight: '44px',
    letterSpacing: '0px',
  },
  headlineLarge: {
    fontSize: '32px',
    fontWeight: 400,
    lineHeight: '40px',
    letterSpacing: '0px',
  },
  headlineMedium: {
    fontSize: '28px',
    fontWeight: 400,
    lineHeight: '36px',
    letterSpacing: '0px',
  },
  headlineSmall: {
    fontSize: '24px',
    fontWeight: 400,
    lineHeight: '32px',
    letterSpacing: '0px',
  },
  titleLarge: {
    fontSize: '22px',
    fontWeight: 500,
    lineHeight: '28px',
    letterSpacing: '0px',
  },
  titleMedium: {
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '0.15px',
  },
  titleSmall: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '0.1px',
  },
  bodyLarge: {
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0.5px',
  },
  bodyMedium: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    letterSpacing: '0.25px',
  },
  bodySmall: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: '16px',
    letterSpacing: '0.4px',
  },
  labelLarge: {
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
    letterSpacing: '0.1px',
  },
  labelMedium: {
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.5px',
  },
  labelSmall: {
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.5px',
  },
};
