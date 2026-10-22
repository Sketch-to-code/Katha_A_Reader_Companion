import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('katha_theme') || 'dark');
  const [readingMode, setReadingMode] = useState(
    () => localStorage.getItem('katha_reading_mode') || 'leisure'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('katha_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('katha_reading_mode', readingMode);
  }, [readingMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, readingMode, setReadingMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
