import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Always force light mode — dark mode disabled to preserve the design scheme
  const [theme] = useState('light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    localStorage.setItem('aegis_theme', 'light');

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const forceLight = () => {
      root.classList.remove('dark');
      root.classList.add('light');
    };
    mediaQuery.addEventListener('change', forceLight);
    return () => mediaQuery.removeEventListener('change', forceLight);
  }, []);

  const toggleTheme = () => {
    // No-op — theme switching disabled, always light
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
