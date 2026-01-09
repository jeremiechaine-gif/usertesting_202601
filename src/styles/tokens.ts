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
    // Primary Button Colors (Pelico Design System)
    primaryButton: {
      primary: {
        bg: '#a8f5c8',       // Primary mint green background (lighter)
        text: '#1a1a1a',     // Dark grey text (near black)
      },
      accent: {
        bg: '#9dd7f5',       // Accent light blue background (lighter shade)
        text: '#1a1a1a',     // Dark grey text (near black)
      },
      secondary: {
        bg: '#FFFFFF',       // Secondary white background
        text: '#1a1a1a',     // Dark grey text (near black)
        border: '#e0e0e0',   // Light grey border
        hoverBg: '#00332e',  // Dark green hover background (same as primary)
        hoverText: '#FFFFFF', // White text on hover (same as primary)
        hoverBorder: '#00332e', // Dark green border on hover (same as primary)
      },
      hover: {
        bg: '#00332e',       // Dark green hover background (for primary & accent)
        text: '#FFFFFF',      // White text on hover
      },
      destructive: {
        bg: '#ffb3ba',       // Light red/pink background
        text: '#1a1a1a',     // Dark grey text (near black)
        hoverBg: '#d32f2f',  // Dark red hover background
      },
      focus: {
        border: '#0070f3',    // Blue focus border
        width: '3px',
      },
      disabled: {
        bg: '#E0E0E0',       // Light gray background
        text: '#999999',     // Muted text
      },
    },
    // Leaf Pattern Border Radius
    leafRadius: {
      square: '0px',         // Square corners (top-left, bottom-right)
      rounded: '8px',        // Rounded corners (top-right, bottom-left)
    },
    // Status
    status: {
      success: '#4caf50',
      successBg: '#e8f5e9',
      warning: '#FFEB3B',
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
      title: ['Anuphan', 'Arial', 'sans-serif'],
      sans: ['Nunito', 'Arial', 'sans-serif'],
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
    // Page title specific tokens (from design spec)
    pageTitle: {
      fontFamily: ['Anuphan', 'Arial', 'sans-serif'],
      fontSize: '48px',
      fontWeight: '500',
      lineHeight: '53px',
      color: 'rgb(15, 42, 47)',
      fontStyle: 'normal',
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
  '--color-primary-button-primary-bg': tokens.colors.primaryButton.primary.bg,
  '--color-primary-button-primary-text': tokens.colors.primaryButton.primary.text,
  '--color-primary-button-accent-bg': tokens.colors.primaryButton.accent.bg,
  '--color-primary-button-accent-text': tokens.colors.primaryButton.accent.text,
  '--color-primary-button-secondary-bg': tokens.colors.primaryButton.secondary.bg,
  '--color-primary-button-secondary-text': tokens.colors.primaryButton.secondary.text,
  '--color-primary-button-secondary-border': tokens.colors.primaryButton.secondary.border,
  '--color-primary-button-secondary-hover-bg': tokens.colors.primaryButton.secondary.hoverBg,
  '--color-primary-button-secondary-hover-text': tokens.colors.primaryButton.secondary.hoverText,
  '--color-primary-button-secondary-hover-border': tokens.colors.primaryButton.secondary.hoverBorder,
  '--color-primary-button-hover-bg': tokens.colors.primaryButton.hover.bg,
  '--color-primary-button-hover-text': tokens.colors.primaryButton.hover.text,
  '--color-primary-button-destructive-bg': tokens.colors.primaryButton.destructive.bg,
  '--color-primary-button-destructive-text': tokens.colors.primaryButton.destructive.text,
  '--color-primary-button-destructive-hover-bg': tokens.colors.primaryButton.destructive.hoverBg,
  '--color-primary-button-focus-border': tokens.colors.primaryButton.focus.border,
  '--color-primary-button-focus-width': tokens.colors.primaryButton.focus.width,
  '--color-primary-button-disabled-bg': tokens.colors.primaryButton.disabled.bg,
  '--color-primary-button-disabled-text': tokens.colors.primaryButton.disabled.text,
  '--radius-leaf-square': tokens.leafRadius.square,
  '--radius-leaf-rounded': tokens.leafRadius.rounded,
  // Typography
  '--font-family-title': tokens.typography.fontFamily.title.join(', '),
  '--font-family-sans': tokens.typography.fontFamily.sans.join(', '),
  '--page-title-font-size': tokens.typography.pageTitle.fontSize,
  '--page-title-font-weight': tokens.typography.pageTitle.fontWeight,
  '--page-title-line-height': tokens.typography.pageTitle.lineHeight,
  '--page-title-color': tokens.typography.pageTitle.color,
} as const;


