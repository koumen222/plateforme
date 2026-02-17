import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const theme = {
    colors: {
      primary: '#2563eb',
      accent: '#3b82f6',
      background: isDark ? '#1f2937' : '#ffffff',
      surface: isDark ? '#374151' : '#f3f4f6',
      text: isDark ? '#f9fafb' : '#111827',
      textSecondary: isDark ? '#d1d5db' : '#6b7280',
      border: isDark ? '#4b5563' : '#e5e7eb',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
    },
    isDark,
    toggleTheme: () => setIsDark(!isDark),
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeSafe = () => {
  let theme;
  try {
    theme = useTheme();
  } catch (error) {
    theme = {
      colors: {
        primary: '#2563eb',
        accent: '#3b82f6',
        background: '#ffffff',
        surface: '#f3f4f6',
        text: '#111827',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
      },
      isDark: false,
      toggleTheme: () => {},
    };
  }
  return theme;
};
