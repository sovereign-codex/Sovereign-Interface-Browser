import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = {
  name: string;
  background: string;
  panel: string;
  accent: string;
  accentSoft: string;
  text: string;
  textSoft: string;
};

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const darkTheme: Theme = {
  name: 'SIB-Nightfall',
  background: '#05060b',
  panel: '#10131d',
  accent: '#7b5cff',
  accentSoft: 'rgba(123, 92, 255, 0.16)',
  text: '#f8f7ff',
  textSoft: '#a5a7c3',
};

const lightTheme: Theme = {
  name: 'SIB-Daybreak',
  background: '#f5f7fb',
  panel: '#ffffff',
  accent: '#3153dc',
  accentSoft: 'rgba(49, 83, 220, 0.1)',
  text: '#0b1021',
  textSoft: '#4c5575',
};

const ThemeContext = createContext<ThemeContextValue>({ theme: darkTheme, toggleTheme: () => {} });

export const useSovereignTheme = () => useContext(ThemeContext);

export const SovereignThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(darkTheme);

  const toggleTheme = (): void => {
    setTheme((prev) => (prev.name === darkTheme.name ? lightTheme : darkTheme));
  };

  useEffect(() => {
    const body = document.body;
    body.style.backgroundColor = theme.background;
    body.style.color = theme.text;
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
