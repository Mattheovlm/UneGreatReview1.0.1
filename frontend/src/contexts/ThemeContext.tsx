import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const darkColors = {
  bg_root: '#09090B',
  bg_card: '#18181B',
  bg_overlay: '#27272A',
  text_primary: '#FAFAFA',
  text_secondary: '#A1A1AA',
  border: '#27272A',
  primary: '#E11D48',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

const lightColors = {
  bg_root: '#FFFFFF',
  bg_card: '#F4F4F5',
  bg_overlay: '#E4E4E7',
  text_primary: '#09090B',
  text_secondary: '#71717A',
  border: '#E4E4E7',
  primary: '#E11D48',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

export type ThemeMode = 'dark' | 'light';
export type ThemeColors = typeof darkColors;

type ThemeContextType = {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved === 'light' || saved === 'dark') setTheme(saved);
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    AsyncStorage.setItem('theme', next);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
