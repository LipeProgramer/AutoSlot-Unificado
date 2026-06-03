import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// ── Helper ─────────────────────────────────────────────────────────────────────
function erroMsg(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { mensagem?: string } } };
  if (e?.response?.status === 401) return 'Senha atual incorreta.';
  if (e?.response?.data?.mensagem) return e.response.data.mensagem;
  return fallback;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Perfil() {
  const { usuario } = useAuth();

  // Formulário de alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroSenha, setErroSenha] = useState('');
  const [sucessoSenha, setSucessoSenha] = useState('');

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha('');
    setSucessoSenha('');

    if (novaSenha.length < 6) {
      setErroSenha('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('A nova senha e a confirmação não coincidem.');
      return;
    }
    if (!senhaAtual.trim()) {
      setErroSenha('Informe a senha atual.');
      return;
    }

    setSalvando(true);
    try {
      await api.put('/api/auth/alterar-senha', { senhaAtual, novaSenha });
      setSucessoSenha('Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setSucessoSenha(''), 4000);
    } catch (err) {
      setErroSenha(erroMsg(err, 'Não foi possível alterar a senha. Tente novamente.'));
    } finally {
      setSalvando(false);
    }
  };

  const badgePerfil = (perfil: string | undefined) => {
    const isAdmin = perfil === 'ADMIN';
    return (
      <span style={{
        fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 99,
        color: isAdmin ? 'var(--accent)' : 'var(--muted)',
        background: isAdmin ? 'var(--accent-sub)' : 'var(--surface-2)',
        letterSpacing: '0.04em',
      }}>
        {isAdmin ? 'Admin' : 'Funcionário'}
      </span>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section>
      {/* Page header */}
      <div className="page-title card">
        <div>
          <h2>Meu Perfil</h2>
          <p>Visualize seus dados e gerencie sua senha de acesso.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
        {/* User info card */}
        <section className="card settings-panel">
          <h3 style={{ marginBottom: 18 }}>Informações da Conta</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--accent-sub)', border: '2px solid rgba(249,115,22,0.3)',
                display: 'grid', placeItems: 'center',
                fontSize: 20, fontWeight: 800, color: 'var(--accent)', flexShrink: 0,
              }}>
                {usuario?.nome
                  ? usuario.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
                  : '?'}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                  {usuario?.nome ?? '—'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                  {usuario?.perfil === 'ADMIN' ? 'Administrador do sistema' : 'Funcionário'}
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Nome
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
                  {usuario?.nome ?? '—'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Perfil
                </div>
                <div>{badgePerfil(usuario?.perfil)}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Status
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 99,
                  color: 'var(--success)',
                  background: 'color-mix(in srgb, var(--success) 15%, transparent)',
                }}>
                  Ativo
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Change password card */}
        <section className="card settings-panel">
          <h3 style={{ marginBottom: 18 }}>Alterar Senha</h3>

          <form onSubmit={handleAlterarSenha}>
            {erroSenha && (
              <div className="alert alert-error" style={{ marginBottom: 14 }}>
                <span>{erroSenha}</span>
              </div>
            )}
            {sucessoSenha && (
              <div className="alert alert-success" style={{ marginBottom: 14 }}>
                <span>✓ {sucessoSenha}</span>
              </div>
            )}

            <label className="field">
              <span>Senha Atual</span>
              <input
                type="password"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
                placeholder="Digite sua senha atual"
                autoComplete="current-password"
                required
              />
            </label>

            <label className="field">
              <span>Nova Senha</span>
              <input
                type="password"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            <label className="field">
              <span>Confirmar Nova Senha</span>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: 8, width: '100%' }}
              disabled={salvando}
            >
              {salvando ? 'Salvando…' : 'Alterar Senha'}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
