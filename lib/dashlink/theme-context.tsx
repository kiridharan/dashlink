"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { getTheme, DEFAULT_THEME_ID } from "./themes";
import type { DashTheme } from "./themes";

const ThemeContext = createContext<DashTheme>(getTheme(DEFAULT_THEME_ID));

export function ThemeProvider({
  themeId,
  children,
}: {
  themeId?: string | null;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={getTheme(themeId)}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useWidgetTheme(): DashTheme {
  return useContext(ThemeContext);
}
