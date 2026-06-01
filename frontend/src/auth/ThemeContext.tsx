import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  temaEscuro: boolean;
  alternarTema: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  temaEscuro: true,
  alternarTema: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [temaEscuro, setTemaEscuro] = useState(() => localStorage.getItem('autoslot-tema') !== 'claro');

  useEffect(() => {
    document.documentElement.dataset.theme = temaEscuro ? 'dark' : 'light';
    localStorage.setItem('autoslot-tema', temaEscuro ? 'escuro' : 'claro');
  }, [temaEscuro]);

  return (
    <ThemeContext.Provider value={{ temaEscuro, alternarTema: () => setTemaEscuro(value => !value) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
