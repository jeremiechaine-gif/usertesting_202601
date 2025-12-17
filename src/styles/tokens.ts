/**
 * Design System Tokens
 * Exported as CSS variables for use with Tailwind CSS
 */

export const tokens = {
  colors: {
    // Backgrounds
    bg: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f1f3f5',
      sidebar: '#f5f5f5',
      banner: '#e3f2fd',
    },
    // Surfaces
    surface: {
      default: '#ffffff',
      elevated: '#ffffff',
      hover: '#f8f9fa',
    },
    // Borders
    border: {
      default: '#e0e0e0',
      light: '#f0f0f0',
      medium: '#d0d0d0',
      dark: '#b0b0b0',
    },
    // Text
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      tertiary: '#999999',
      disabled: '#cccccc',
      inverse: '#ffffff',
    },
    // Muted/Neutral
    muted: {
      default: '#f5f5f5',
      light: '#fafafa',
      dark: '#e5e5e5',
    },
    // Link
    link: {
      default: '#1976d2',
      hover: '#1565c0',
      active: '#0d47a1',
    },
    // Status
    status: {
      success: '#4caf50',
      successBg: '#e8f5e9',
      warning: '#ff9800',
      warningBg: '#fff3e0',
      error: '#f44336',
      errorBg: '#ffebee',
      info: '#2196f3',
      infoBg: '#e3f2fd',
    },
    // Group header tints
    groupHeader: {
      green: '#e8f5e9',
      purple: '#f3e5f5',
    },
    // Table
    table: {
      headerBg: '#fafafa',
      rowHover: '#f5f5f5',
      rowSelected: '#e3f2fd',
      border: '#e0e0e0',
    },
  },
  typography: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      mono: ['Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.25rem',   // 4px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    full: '9999px',
  },
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

// Export CSS variable names
export const cssVars = {
  '--color-bg-primary': tokens.colors.bg.primary,
  '--color-bg-secondary': tokens.colors.bg.secondary,
  '--color-bg-tertiary': tokens.colors.bg.tertiary,
  '--color-bg-sidebar': tokens.colors.bg.sidebar,
  '--color-bg-banner': tokens.colors.bg.banner,
  '--color-surface-default': tokens.colors.surface.default,
  '--color-surface-elevated': tokens.colors.surface.elevated,
  '--color-surface-hover': tokens.colors.surface.hover,
  '--color-border-default': tokens.colors.border.default,
  '--color-border-light': tokens.colors.border.light,
  '--color-border-medium': tokens.colors.border.medium,
  '--color-border-dark': tokens.colors.border.dark,
  '--color-text-primary': tokens.colors.text.primary,
  '--color-text-secondary': tokens.colors.text.secondary,
  '--color-text-tertiary': tokens.colors.text.tertiary,
  '--color-text-disabled': tokens.colors.text.disabled,
  '--color-text-inverse': tokens.colors.text.inverse,
  '--color-muted-default': tokens.colors.muted.default,
  '--color-muted-light': tokens.colors.muted.light,
  '--color-muted-dark': tokens.colors.muted.dark,
  '--color-link-default': tokens.colors.link.default,
  '--color-link-hover': tokens.colors.link.hover,
  '--color-link-active': tokens.colors.link.active,
  '--color-status-success': tokens.colors.status.success,
  '--color-status-success-bg': tokens.colors.status.successBg,
  '--color-status-warning': tokens.colors.status.warning,
  '--color-status-warning-bg': tokens.colors.status.warningBg,
  '--color-status-error': tokens.colors.status.error,
  '--color-status-error-bg': tokens.colors.status.errorBg,
  '--color-status-info': tokens.colors.status.info,
  '--color-status-info-bg': tokens.colors.status.infoBg,
  '--color-group-header-green': tokens.colors.groupHeader.green,
  '--color-group-header-purple': tokens.colors.groupHeader.purple,
  '--color-table-header-bg': tokens.colors.table.headerBg,
  '--color-table-row-hover': tokens.colors.table.rowHover,
  '--color-table-row-selected': tokens.colors.table.rowSelected,
  '--color-table-border': tokens.colors.table.border,
} as const;

