import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="center-page">
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <Link className="btn btn-primary" to="/mapa">Voltar ao início</Link>
    </div>
  );
}
