import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/src/utils/constants';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Primary
  primary: string;

  // Semantic
  success: string;
  warning: string;
  error: string;
  info: string;

  // Grayscale
  white: string;
  black: string;

  // Feature Colors
  habits: string;
  sleep: string;
  exercise: string;
  nutrition: string;
  journal: string;

  // Background
  background: string;
  surface: string;
  surfaceSecondary: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Borders
  border: string;
  borderLight: string;

  // Overlays
  overlay: string;
  shimmer: string;
}

export const lightColors: ThemeColors = {
  primary: '#007AFF',

  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5856D6',

  white: '#FFFFFF',
  black: '#000000',

  habits: '#FF6B6B',
  sleep: '#845EF7',
  exercise: '#20C997',
  nutrition: '#FFA94D',
  journal: '#339AF0',

  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F2F7',

  textPrimary: '#000000',
  textSecondary: '#3C3C43',
  textTertiary: '#8E8E93',
  textInverse: '#FFFFFF',

  border: '#C6C6C8',
  borderLight: '#E5E5EA',

  overlay: 'rgba(0, 0, 0, 0.4)',
  shimmer: 'rgba(255, 255, 255, 0.6)',
};

export const darkColors: ThemeColors = {
  primary: '#0A84FF',

  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#5E5CE6',

  white: '#FFFFFF',
  black: '#000000',

  habits: '#FF6B6B',
  sleep: '#9775FA',
  exercise: '#38D9A9',
  nutrition: '#FFB366',
  journal: '#4DABF7',

  background: '#000000',
  surface: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',

  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',
  textInverse: '#000000',

  border: '#38383A',
  borderLight: '#48484A',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shimmer: 'rgba(255, 255, 255, 0.1)',
};

interface ThemeContextType {
  colors: ThemeColors;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setModeState(savedMode as ThemeMode);
      }
    } catch {
      // Silent fail - use default theme
    }
    setIsLoaded(true);
  };

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
    } catch {
      // Silent fail - theme applied but not persisted
    }
  };

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ colors, mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
