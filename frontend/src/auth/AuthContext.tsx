import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface Usuario {
  nome: string;
  perfil: 'ADMIN' | 'FUNCIONARIO';
}

interface AuthContextData {
  logado: boolean;
  usuario: Usuario | null;
  loading: boolean;
  login(token: string, usuario: Usuario): void;
  logout(): void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userSalvo = localStorage.getItem('@AutoSlot:user');
    if (userSalvo) setUsuario(JSON.parse(userSalvo));
    setLoading(false);
  }, []);

  const login = (token: string, user: Usuario) => {
    localStorage.setItem('@AutoSlot:token', token);
    localStorage.setItem('@AutoSlot:user', JSON.stringify(user));
    setUsuario(user);
  };

  const logout = () => {
    localStorage.clear();
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ logado: !!usuario, usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};