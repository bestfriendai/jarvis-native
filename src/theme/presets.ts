/**
 * Theme Presets
 * Multiple beautiful theme packages users can choose from
 */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  mode: 'dark' | 'light';
  colors: {
    // Primary Brand Color
    primary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };

    // Accent Colors
    accent: {
      cyan: string;
      purple: string;
      pink: string;
      orange: string;
      blue: string;
      yellow: string;
    };

    // Backgrounds
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
      elevated: string;
    };

    // Text Colors
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      disabled: string;
      placeholder: string;
      inverse: string;
    };

    // Semantic Colors
    success: string;
    warning: string;
    error: string;
    info: string;

    // Border Colors
    border: {
      default: string;
      subtle: string;
      focus: string;
      error: string;
    };

    // Gradient definitions
    gradient: {
      primary: string[];
      primaryGlow: string[];
      cyan: string[];
      cyanPurple: string[];
      purplePink: string[];
      pinkOrange: string[];
      rainbow: string[];
      hero: string[];
      heroReverse: string[];
      card: string[];
      cardElevated: string[];
      glass: string[];
      glassVibrant: string[];
      overlay: string[];
      shimmer: string[];
    };
  };
}

// Neon Dark (Default) - Vibrant emerald green with pure black backgrounds
export const neonDarkPreset: ThemePreset = {
  id: 'neon-dark',
  name: 'Neon Dark',
  description: 'Vibrant emerald with deep blacks',
  icon: '🌙',
  mode: 'dark',
  colors: {
    primary: {
      main: '#10E87F',
      light: '#3CFFAA',
      dark: '#06C270',
      contrast: '#FFFFFF',
    },
    accent: {
      cyan: '#00E5FF',
      purple: '#B388FF',
      pink: '#FF4081',
      orange: '#FF9100',
      blue: '#2196F3',
      yellow: '#FFD600',
    },
    background: {
      primary: '#000000',
      secondary: '#0D1117',
      tertiary: '#161B22',
      elevated: '#1C2128',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#F0F0F0',
      tertiary: '#A0A0A0',
      disabled: '#6E7681',
      placeholder: '#6E7681',
      inverse: '#0F172A',
    },
    success: '#10E87F',
    warning: '#FFB020',
    error: '#FF3860',
    info: '#2196F3',
    border: {
      default: '#30363D',
      subtle: '#21262D',
      focus: '#10E87F',
      error: '#FF3860',
    },
    gradient: {
      primary: ['#10E87F', '#06C270'] as const,
      primaryGlow: ['#10E87F', '#3CFFAA', '#10E87F'] as const,
      cyan: ['#00E5FF', '#00B8D4'] as const,
      cyanPurple: ['#00E5FF', '#B388FF'] as const,
      purplePink: ['#B388FF', '#FF4081'] as const,
      pinkOrange: ['#FF4081', '#FF9100'] as const,
      rainbow: ['#10E87F', '#00E5FF', '#B388FF', '#FF4081'] as const,
      hero: ['#10E87F', '#00E5FF', '#B388FF'] as const,
      heroReverse: ['#B388FF', '#00E5FF', '#10E87F'] as const,
      card: ['#0D1117', '#161B22'] as const,
      cardElevated: ['#161B22', '#1C2128'] as const,
      glass: ['rgba(13, 17, 23, 0.8)', 'rgba(22, 27, 34, 0.4)'] as const,
      glassVibrant: ['rgba(16, 232, 127, 0.15)', 'rgba(0, 229, 255, 0.1)'] as const,
      overlay: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.95)'] as const,
      shimmer: ['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent'] as const,
    },
  },
};

// Ocean Blue - Deep blues and cyans for a calm, professional look
export const oceanBluePreset: ThemePreset = {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  description: 'Deep blues with cyan accents',
  icon: '🌊',
  mode: 'dark',
  colors: {
    primary: {
      main: '#00B4D8',
      light: '#48CAE4',
      dark: '#0096C7',
      contrast: '#FFFFFF',
    },
    accent: {
      cyan: '#90E0EF',
      purple: '#7209B7',
      pink: '#F72585',
      orange: '#FF8500',
      blue: '#00B4D8',
      yellow: '#FFD60A',
    },
    background: {
      primary: '#03045E',
      secondary: '#023E8A',
      tertiary: '#0077B6',
      elevated: '#0096C7',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#CAF0F8',
      tertiary: '#90E0EF',
      disabled: '#6E8898',
      placeholder: '#6E8898',
      inverse: '#03045E',
    },
    success: '#00B4D8',
    warning: '#FFB703',
    error: '#E63946',
    info: '#48CAE4',
    border: {
      default: '#0096C7',
      subtle: '#0077B6',
      focus: '#00B4D8',
      error: '#E63946',
    },
    gradient: {
      primary: ['#00B4D8', '#0096C7'] as const,
      primaryGlow: ['#00B4D8', '#48CAE4', '#00B4D8'] as const,
      cyan: ['#90E0EF', '#48CAE4'] as const,
      cyanPurple: ['#48CAE4', '#7209B7'] as const,
      purplePink: ['#7209B7', '#F72585'] as const,
      pinkOrange: ['#F72585', '#FF8500'] as const,
      rainbow: ['#00B4D8', '#48CAE4', '#7209B7', '#F72585'] as const,
      hero: ['#00B4D8', '#48CAE4', '#7209B7'] as const,
      heroReverse: ['#7209B7', '#48CAE4', '#00B4D8'] as const,
      card: ['#023E8A', '#0077B6'] as const,
      cardElevated: ['#0077B6', '#0096C7'] as const,
      glass: ['rgba(2, 62, 138, 0.8)', 'rgba(0, 119, 182, 0.4)'] as const,
      glassVibrant: ['rgba(0, 180, 216, 0.15)', 'rgba(72, 202, 228, 0.1)'] as const,
      overlay: ['rgba(3, 4, 94, 0)', 'rgba(3, 4, 94, 0.95)'] as const,
      shimmer: ['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent'] as const,
    },
  },
};

// Sunset Orange - Warm oranges and reds for an energetic vibe
export const sunsetOrangePreset: ThemePreset = {
  id: 'sunset-orange',
  name: 'Sunset Orange',
  description: 'Warm sunset colors',
  icon: '🌅',
  mode: 'dark',
  colors: {
    primary: {
      main: '#FF6B35',
      light: '#FF8E53',
      dark: '#E85A2A',
      contrast: '#FFFFFF',
    },
    accent: {
      cyan: '#00D9FF',
      purple: '#9D4EDD',
      pink: '#FF006E',
      orange: '#FF6B35',
      blue: '#3A86FF',
      yellow: '#FFD60A',
    },
    background: {
      primary: '#1A0A00',
      secondary: '#2D1B0E',
      tertiary: '#4A2C1A',
      elevated: '#5C3823',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#FFE5D9',
      tertiary: '#FFCDB2',
      disabled: '#9A6B52',
      placeholder: '#9A6B52',
      inverse: '#1A0A00',
    },
    success: '#06D6A0',
    warning: '#FFD60A',
    error: '#EF476F',
    info: '#3A86FF',
    border: {
      default: '#5C3823',
      subtle: '#4A2C1A',
      focus: '#FF6B35',
      error: '#EF476F',
    },
    gradient: {
      primary: ['#FF6B35', '#E85A2A'] as const,
      primaryGlow: ['#FF6B35', '#FF8E53', '#FF6B35'] as const,
      cyan: ['#00D9FF', '#00B8D4'] as const,
      cyanPurple: ['#00D9FF', '#9D4EDD'] as const,
      purplePink: ['#9D4EDD', '#FF006E'] as const,
      pinkOrange: ['#FF006E', '#FF6B35'] as const,
      rainbow: ['#FF6B35', '#9D4EDD', '#3A86FF', '#06D6A0'] as const,
      hero: ['#FF6B35', '#9D4EDD', '#3A86FF'] as const,
      heroReverse: ['#3A86FF', '#9D4EDD', '#FF6B35'] as const,
      card: ['#2D1B0E', '#4A2C1A'] as const,
      cardElevated: ['#4A2C1A', '#5C3823'] as const,
      glass: ['rgba(45, 27, 14, 0.8)', 'rgba(74, 44, 26, 0.4)'] as const,
      glassVibrant: ['rgba(255, 107, 53, 0.15)', 'rgba(255, 142, 83, 0.1)'] as const,
      overlay: ['rgba(26, 10, 0, 0)', 'rgba(26, 10, 0, 0.95)'] as const,
      shimmer: ['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent'] as const,
    },
  },
};

// Forest Green - Natural greens and browns for a calm, earthy feel
export const forestGreenPreset: ThemePreset = {
  id: 'forest-green',
  name: 'Forest Green',
  description: 'Natural greens and earthy tones',
  icon: '🌲',
  mode: 'dark',
  colors: {
    primary: {
      main: '#52B788',
      light: '#74C69D',
      dark: '#40916C',
      contrast: '#FFFFFF',
    },
    accent: {
      cyan: '#80ED99',
      purple: '#A663CC',
      pink: '#FF6F91',
      orange: '#FFB563',
      blue: '#4EA8DE',
      yellow: '#F2CC8F',
    },
    background: {
      primary: '#081C15',
      secondary: '#1B4332',
      tertiary: '#2D6A4F',
      elevated: '#40916C',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#D8F3DC',
      tertiary: '#B7E4C7',
      disabled: '#6B9080',
      placeholder: '#6B9080',
      inverse: '#081C15',
    },
    success: '#52B788',
    warning: '#F2CC8F',
    error: '#E63946',
    info: '#4EA8DE',
    border: {
      default: '#2D6A4F',
      subtle: '#1B4332',
      focus: '#52B788',
      error: '#E63946',
    },
    gradient: {
      primary: ['#52B788', '#40916C'] as const,
      primaryGlow: ['#52B788', '#74C69D', '#52B788'] as const,
      cyan: ['#80ED99', '#57CC99'] as const,
      cyanPurple: ['#80ED99', '#A663CC'] as const,
      purplePink: ['#A663CC', '#FF6F91'] as const,
      pinkOrange: ['#FF6F91', '#FFB563'] as const,
      rainbow: ['#52B788', '#80ED99', '#A663CC', '#4EA8DE'] as const,
      hero: ['#52B788', '#80ED99', '#A663CC'] as const,
      heroReverse: ['#A663CC', '#80ED99', '#52B788'] as const,
      card: ['#1B4332', '#2D6A4F'] as const,
      cardElevated: ['#2D6A4F', '#40916C'] as const,
      glass: ['rgba(27, 67, 50, 0.8)', 'rgba(45, 106, 79, 0.4)'] as const,
      glassVibrant: ['rgba(82, 183, 136, 0.15)', 'rgba(116, 198, 157, 0.1)'] as const,
      overlay: ['rgba(8, 28, 21, 0)', 'rgba(8, 28, 21, 0.95)'] as const,
      shimmer: ['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent'] as const,
    },
  },
};

// Light Mode - Clean whites with vibrant colors
export const lightModePreset: ThemePreset = {
  id: 'light-mode',
  name: 'Light Mode',
  description: 'Clean whites with vibrant colors',
  icon: '☀️',
  mode: 'light',
  colors: {
    primary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
      contrast: '#FFFFFF',
    },
    accent: {
      cyan: '#00E5FF',
      purple: '#B388FF',
      pink: '#FF4081',
      orange: '#FF9100',
      blue: '#2196F3',
      yellow: '#FFD600',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F1F5F9',
      elevated: '#E2E8F0',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#64748B',
      disabled: '#94A3B8',
      placeholder: '#94A3B8',
      inverse: '#F8FAFC',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    border: {
      default: '#E2E8F0',
      subtle: '#F1F5F9',
      focus: '#10B981',
      error: '#EF4444',
    },
    gradient: {
      primary: ['#10B981', '#059669'] as const,
      primaryGlow: ['#10B981', '#34D399', '#10B981'] as const,
      cyan: ['#00E5FF', '#00B8D4'] as const,
      cyanPurple: ['#00E5FF', '#B388FF'] as const,
      purplePink: ['#B388FF', '#FF4081'] as const,
      pinkOrange: ['#FF4081', '#FF9100'] as const,
      rainbow: ['#10B981', '#00E5FF', '#B388FF', '#FF4081'] as const,
      hero: ['#10B981', '#00E5FF', '#B388FF'] as const,
      heroReverse: ['#B388FF', '#00E5FF', '#10B981'] as const,
      card: ['#F8FAFC', '#F1F5F9'] as const,
      cardElevated: ['#FFFFFF', '#F8FAFC'] as const,
      glass: ['rgba(248, 250, 252, 0.8)', 'rgba(241, 245, 249, 0.4)'] as const,
      glassVibrant: ['rgba(16, 185, 129, 0.1)', 'rgba(52, 211, 153, 0.05)'] as const,
      overlay: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.9)'] as const,
      shimmer: ['transparent', 'rgba(0, 0, 0, 0.05)', 'transparent'] as const,
    },
  },
};

// Purple Dream - Rich purples and magentas for a creative vibe
export const purpleDreamPreset: ThemePreset = {
  id: 'purple-dream',
  name: 'Purple Dream',
  description: 'Rich purples and magentas',
  icon: '💜',
  mode: 'dark',
  colors: {
    primary: {
      main: '#A855F7',
      light: '#C084FC',
      dark: '#9333EA',
      contrast: '#FFFFFF',
    },
    accent: {
      cyan: '#22D3EE',
      purple: '#A855F7',
      pink: '#EC4899',
      orange: '#FB923C',
      blue: '#3B82F6',
      yellow: '#FBBF24',
    },
    background: {
      primary: '#0F0519',
      secondary: '#1E0B33',
      tertiary: '#2D1147',
      elevated: '#3C1A5B',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#F3E8FF',
      tertiary: '#E9D5FF',
      disabled: '#9F7AEA',
      placeholder: '#9F7AEA',
      inverse: '#0F0519',
    },
    success: '#10B981',
    warning: '#FBBF24',
    error: '#F43F5E',
    info: '#3B82F6',
    border: {
      default: '#3C1A5B',
      subtle: '#2D1147',
      focus: '#A855F7',
      error: '#F43F5E',
    },
    gradient: {
      primary: ['#A855F7', '#9333EA'] as const,
      primaryGlow: ['#A855F7', '#C084FC', '#A855F7'] as const,
      cyan: ['#22D3EE', '#06B6D4'] as const,
      cyanPurple: ['#22D3EE', '#A855F7'] as const,
      purplePink: ['#A855F7', '#EC4899'] as const,
      pinkOrange: ['#EC4899', '#FB923C'] as const,
      rainbow: ['#A855F7', '#22D3EE', '#EC4899', '#FB923C'] as const,
      hero: ['#A855F7', '#22D3EE', '#EC4899'] as const,
      heroReverse: ['#EC4899', '#22D3EE', '#A855F7'] as const,
      card: ['#1E0B33', '#2D1147'] as const,
      cardElevated: ['#2D1147', '#3C1A5B'] as const,
      glass: ['rgba(30, 11, 51, 0.8)', 'rgba(45, 17, 71, 0.4)'] as const,
      glassVibrant: ['rgba(168, 85, 247, 0.15)', 'rgba(192, 132, 252, 0.1)'] as const,
      overlay: ['rgba(15, 5, 25, 0)', 'rgba(15, 5, 25, 0.95)'] as const,
      shimmer: ['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent'] as const,
    },
  },
};

// All available presets
export const themePresets: ThemePreset[] = [
  neonDarkPreset,
  oceanBluePreset,
  sunsetOrangePreset,
  forestGreenPreset,
  purpleDreamPreset,
  lightModePreset,
];

// Get preset by ID
export const getPresetById = (id: string): ThemePreset | undefined => {
  return themePresets.find((preset) => preset.id === id);
};

// Get preset colors
export const getPresetColors = (id: string) => {
  const preset = getPresetById(id);
  return preset ? preset.colors : neonDarkPreset.colors;
};
