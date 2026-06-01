import React from 'react'; // Adicione esta linha
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  children: React.ReactElement; // Alterado de JSX.Element para React.ReactElement
  perfisPermitidos?: Array<'ADMIN' | 'FUNCIONARIO'>;
}

export const PrivateRoute = ({ children, perfisPermitidos }: PrivateRouteProps) => {
  const { logado, usuario, loading } = useAuth();

  // Enquanto verifica se o usuário está logado (ex: lendo localStorage)
  if (loading) {
    return (
      <div className="login-wrapper">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Se não estiver logado, manda para o login
  if (!logado) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige perfis específicos e o usuário não tem o perfil necessário
  if (perfisPermitidos && usuario && !perfisPermitidos.includes(usuario.perfil as any)) {
    return <Navigate to="/acesso-negado" replace />;
  }

  // Se passou em tudo, renderiza o componente filho
  return children;
};