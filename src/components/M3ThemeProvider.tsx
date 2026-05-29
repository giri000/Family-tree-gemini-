import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { m3LightScheme, m3DarkScheme, m3TypographyScale, ThemeMode } from '../lib/m3Theme';

// Custom context to toggle/get current M3 theme state if needed
interface M3ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
}

const M3ThemeContext = createContext<M3ThemeContextType>({
  mode: 'light',
  isDark: false,
});

export const useM3Theme = () => useContext(M3ThemeContext);

export function M3ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    // 1. Initial detection
    const isDarkGlobal = document.documentElement.classList.contains('dark');
    setMode(isDarkGlobal ? 'dark' : 'light');

    // 2. Observe mutations on documentelment class changes (smooth integration with any existing dark toggler)
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setMode(isDark ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const isDark = mode === 'dark';
  const activeScheme = isDark ? m3DarkScheme : m3LightScheme;

  // Build the complete Material Design 3 (M3) theme configuration, using the centralized specifications
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: activeScheme.primary,
        contrastText: activeScheme.onPrimary,
      },
      secondary: {
        main: activeScheme.secondary,
        contrastText: activeScheme.onSecondary,
      },
      error: {
        main: activeScheme.error,
        contrastText: activeScheme.onError,
      },
      background: {
        default: activeScheme.background,
        paper: activeScheme.surface,
      },
      text: {
        primary: activeScheme.onSurface,
        secondary: activeScheme.onSurfaceVariant,
      },
      divider: activeScheme.outlineVariant,
    },
    typography: {
      fontFamily: '"Inter", sans-serif',
      // M3 Typography standards mapped cleanly to predefined MUI slots for absolute type safety
      h1: {
        fontSize: m3TypographyScale.displayLarge.fontSize,
        fontWeight: m3TypographyScale.displayLarge.fontWeight,
        lineHeight: m3TypographyScale.displayLarge.lineHeight,
        letterSpacing: m3TypographyScale.displayLarge.letterSpacing,
      },
      h2: {
        fontSize: m3TypographyScale.displayMedium.fontSize,
        fontWeight: m3TypographyScale.displayMedium.fontWeight,
        lineHeight: m3TypographyScale.displayMedium.lineHeight,
      },
      h3: {
        fontSize: m3TypographyScale.displaySmall.fontSize,
        fontWeight: m3TypographyScale.displaySmall.fontWeight,
        lineHeight: m3TypographyScale.displaySmall.lineHeight,
      },
      h4: {
        fontSize: m3TypographyScale.headlineLarge.fontSize,
        fontWeight: m3TypographyScale.headlineLarge.fontWeight,
        lineHeight: m3TypographyScale.headlineLarge.lineHeight,
      },
      h5: {
        fontSize: m3TypographyScale.headlineMedium.fontSize,
        fontWeight: m3TypographyScale.headlineMedium.fontWeight,
        lineHeight: m3TypographyScale.headlineMedium.lineHeight,
      },
      h6: {
        fontSize: m3TypographyScale.headlineSmall.fontSize,
        fontWeight: m3TypographyScale.headlineSmall.fontWeight,
        lineHeight: m3TypographyScale.headlineSmall.lineHeight,
      },
      subtitle1: {
        fontSize: m3TypographyScale.titleLarge.fontSize,
        fontWeight: m3TypographyScale.titleLarge.fontWeight,
        lineHeight: m3TypographyScale.titleLarge.lineHeight,
      },
      subtitle2: {
        fontSize: m3TypographyScale.titleMedium.fontSize,
        fontWeight: m3TypographyScale.titleMedium.fontWeight,
        lineHeight: m3TypographyScale.titleMedium.lineHeight,
        letterSpacing: m3TypographyScale.titleMedium.letterSpacing,
      },
      body1: {
        fontSize: m3TypographyScale.bodyLarge.fontSize,
        fontWeight: m3TypographyScale.bodyLarge.fontWeight,
        lineHeight: m3TypographyScale.bodyLarge.lineHeight,
        letterSpacing: m3TypographyScale.bodyLarge.letterSpacing,
      },
      body2: {
        fontSize: m3TypographyScale.bodyMedium.fontSize,
        fontWeight: m3TypographyScale.bodyMedium.fontWeight,
        lineHeight: m3TypographyScale.bodyMedium.lineHeight,
        letterSpacing: m3TypographyScale.bodyMedium.letterSpacing,
      },
      caption: {
        fontSize: m3TypographyScale.bodySmall.fontSize,
        fontWeight: m3TypographyScale.bodySmall.fontWeight,
        lineHeight: m3TypographyScale.bodySmall.lineHeight,
        letterSpacing: m3TypographyScale.bodySmall.letterSpacing,
      },
      overline: {
        fontSize: m3TypographyScale.labelLarge.fontSize,
        fontWeight: m3TypographyScale.labelLarge.fontWeight,
        lineHeight: m3TypographyScale.labelLarge.lineHeight,
        letterSpacing: m3TypographyScale.labelLarge.letterSpacing,
        textTransform: 'none',
      },
      button: {
        textTransform: 'none', // Strict M3 standard: sentence-casing for buttons
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 16, // Default container medium corner (16px)
    },
    shadows: [
      'none',
      '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)', // Elevation Level 1
      '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)', // Elevation Level 2
      '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)', // Elevation Level 3
      '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30)', // Elevation Level 4
      '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30)', // Elevation Level 5
      ...Array(19).fill('none'), // Filling the rest of shadows array up to 24 length
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          body {
            background-color: var(--md-sys-color-background) !important;
            color: var(--md-sys-color-on-background) !important;
            transition: background-color 0.2s ease, color 0.15s ease;
          }
        `,
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 100, // M3 Buttons fully rounded pills
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
            '&:hover': {
              boxShadow: '0px 1px 3px 1px rgba(0,0,0,0.15)',
            },
          },
          contained: {
            backgroundColor: activeScheme.primary,
            color: activeScheme.onPrimary,
            '&:hover': {
              backgroundColor: isDark ? '#A1ADFF' : '#4338CA',
            },
          },
          outlined: {
            borderColor: activeScheme.outline,
            color: activeScheme.primary,
            borderWidth: '1px',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(186,195,255,0.08)' : 'rgba(79,70,229,0.08)',
              borderColor: activeScheme.primary,
            },
          },
          text: {
            padding: '10px 16px',
            color: activeScheme.primary,
            '&:hover': {
              backgroundColor: isDark ? 'rgba(186,195,255,0.08)' : 'rgba(79,70,229,0.08)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 28, // M3 Extra Large Rounded Corners (24px - 28px)
            boxShadow: isDark
              ? '0px 1px 2px rgba(0,0,0,0.4), 0px 2px 6px rgba(0,0,0,0.3)'
              : '0px 1px 3px rgba(0,0,0,0.05), 0px 1px 2px rgba(0,0,0,0.1)',
            backgroundColor: activeScheme.surface,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28, // M3 Alert & Dialog roundness is 28px
            padding: '16px',
            boxShadow: '0px 8px 12px 6px rgba(0, 0, 0, 0.15)',
            backgroundColor: activeScheme.surface,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 100, // Fully rounded
            height: '32px',
            fontSize: '12px',
            fontWeight: 500,
            backgroundColor: activeScheme.secondaryContainer,
            color: activeScheme.onSecondaryContainer,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12, // M3 shape outline corners
              '& fieldset': {
                borderColor: activeScheme.outlineVariant,
              },
              '&:hover fieldset': {
                borderColor: activeScheme.outline,
              },
              '&.Mui-focused fieldset': {
                borderColor: activeScheme.primary,
                borderWidth: '2px',
              },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12, // Round inputs in M3 style
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <M3ThemeContext.Provider value={{ mode, isDark }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </M3ThemeContext.Provider>
  );
}
