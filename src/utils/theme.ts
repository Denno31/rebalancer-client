/**
 * Application theme constants based on Binance design
 */

export const COLORS = {
  // Primary brand colors
  primary: {
    yellow: '#F0B90B',
    yellowHover: '#F8D33A',
    black: '#000000',
  },
  
  // Background colors
  background: {
    card: '#1E2329',
    page: '#0B0E11',
    input: '#2B3139',
  },
  
  // Border colors
  border: {
    default: '#2A2E37',
    light: '#474D57',
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#848E9C',
    tertiary: '#5E6673',
    yellow: '#F0B90B',
  },

  // Status colors
  status: {
    success: '#02C076',
    error: '#F84960',
    warning: '#F0B90B',
    info: '#1E90FF',
  }
};

// Common style combinations
export const STYLES = {
  cardBg: `bg-[${COLORS.background.card}] border border-[${COLORS.border.default}] rounded-lg shadow-md`,
  primaryButton: `bg-[${COLORS.primary.yellow}] hover:bg-[${COLORS.primary.yellowHover}] text-black font-medium`,
  secondaryButton: `bg-[${COLORS.background.input}] hover:bg-[${COLORS.border.light}] text-white font-medium`,
};
