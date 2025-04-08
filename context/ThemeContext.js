import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  background: '#f5f5f5',
  cardBackground: '#ffffff',
  text: '#2c3e50',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  primary: '#6366F1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
};

export const darkTheme = {
  background: '#1f2937',
  cardBackground: '#374151',
  text: '#f3f4f6',
  textSecondary: '#9ca3af',
  border: '#4b5563',
  primary: '#818cf8',
  success: '#34d399',
  danger: '#f87171',
  warning: '#fbbf24',
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('Light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const settings = await AsyncStorage.getItem('userSettings');
        if (settings) {
          const parsed = JSON.parse(settings);
          setTheme(parsed.theme || 'Light');
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const currentTheme = theme === 'Light' ? lightTheme : darkTheme;

  const value = {
    theme,
    setTheme,
    currentTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 