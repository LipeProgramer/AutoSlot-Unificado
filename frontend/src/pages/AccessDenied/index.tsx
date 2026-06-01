import React from 'react';
import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <div className="center-page">
      <h1 className="error-title">403</h1>
      <h2>Acesso Restrito</h2>
      <p>Seu perfil não tem permissão para acessar esta funcionalidade.</p>
      <Link to="/mapa" className="btn-link">Voltar ao Início</Link>
    </div>
  );
}