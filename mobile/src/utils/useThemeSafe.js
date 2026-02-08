import { useTheme } from '../contexts/ThemeContext';

export const useThemeSafe = () => {
  let theme;
  try {
    theme = useTheme();
  } catch (error) {
    // Fallback theme if not within ThemeProvider
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
