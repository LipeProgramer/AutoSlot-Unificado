import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../auth/ThemeContext';
import { Sun, Moon, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import logoUrl from '../../images/Logo.png';
import api from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const { temaEscuro, alternarTema } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) { setErro('Preencha login e senha.'); return; }

    setLoading(true);
    setErro('');

    try {
      const { data } = await api.post<{ token: string }>('/api/auth/login', { email, senha });

      const { token } = data;

      // Decodifica o payload do JWT sem biblioteca externa
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Extrai nome e role do payload (ClaimTypes.Name / ClaimTypes.Role)
      const nome: string =
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        payload.name ??
        payload.nome ??
        '';

      const roleRaw: string =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        payload.role ??
        payload.Role ??
        '';

      // Converte "Admin" → "ADMIN", "Funcionario" → "FUNCIONARIO"
      const perfil: 'ADMIN' | 'FUNCIONARIO' =
        roleRaw.toLowerCase() === 'admin' ? 'ADMIN' : 'FUNCIONARIO';

      login(token, { nome, perfil });
      navigate('/mapa');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 401 || status === 400) {
        setErro('Usuário ou senha inválidos.');
      } else {
        setErro('Não foi possível conectar ao servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão de tema */}
      <div className="Botão-tema">
        <button className="btn-tema" onClick={alternarTema} title={temaEscuro ? 'Modo claro' : 'Modo escuro'}>
          {temaEscuro ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      <main className="login-page">
        <section className="login-card">
          {/* Logo + Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
            <img
              src={logoUrl}
              alt="AutoSlot"
              style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }}
            />
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 3 }}>AutoSlot</h1>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Sistema de controle de estacionamento</p>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <span>{erro}</span>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleLogin} noValidate>
            <div className="field">
              <label>E-mail</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={14}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)', pointerEvents: 'none' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{ paddingLeft: 36 }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field">
              <label>Senha</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={14}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)', pointerEvents: 'none' }}
                />
                <input
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: 36 }}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary full"
              disabled={loading}
              style={{ marginTop: 6, minHeight: 44, fontSize: 14, fontWeight: 700 }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: 'spin 0.75s linear infinite' }} /> Entrando…</>
                : <><ArrowRight size={16} /> Entrar no sistema</>
              }
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
