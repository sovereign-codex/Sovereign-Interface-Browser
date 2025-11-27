import React, { createContext, useContext, useMemo } from 'react';

type Theme = {
  name: string;
  background: string;
  panel: string;
  accent: string;
  accentSoft: string;
  text: string;
  textSoft: string;
};

const defaultTheme: Theme = {
  name: 'SIB-Nightfall',
  background: '#05060b',
  panel: '#10131d',
  accent: '#7b5cff',
  accentSoft: 'rgba(123, 92, 255, 0.16)',
  text: '#f8f7ff',
  textSoft: '#a5a7c3',
};

const ThemeContext = createContext<Theme>(defaultTheme);

export const useSovereignTheme = () => useContext(ThemeContext);

export const SovereignThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useMemo(() => defaultTheme, []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
