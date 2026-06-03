import React, { useEffect, useState } from 'react';
import api from '../../services/api';

// ── Types ──────────────────────────────────────────────────────────────────────
type NivelAcesso = 'ADMIN' | 'FUNCIONARIO';

interface Funcionario {
  id: number;
  nome: string;
  email: string;
  nivelAcesso: NivelAcesso;
  ativo: boolean;
}

interface FuncionarioForm {
  nome: string;
  email: string;
  nivelAcesso: NivelAcesso;
  senha: string;
}

// ── Helper ─────────────────────────────────────────────────────────────────────
function erroMsg(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { mensagem?: string } } };
  if (e?.response?.status === 403) return 'Sem permissão de administrador.';
  if (e?.response?.data?.mensagem) return e.response.data.mensagem;
  return fallback;
}

const FORM_VAZIO: FuncionarioForm = {
  nome: '',
  email: '',
  nivelAcesso: 'FUNCIONARIO',
  senha: '',
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function Funcionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroApi, setErroApi] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Modal state
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [form, setForm] = useState<FuncionarioForm>(FORM_VAZIO);
  const [erroModal, setErroModal] = useState('');
  const [salvando, setSalvando] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const carregarFuncionarios = async () => {
    setCarregando(true);
    setErroApi('');
    try {
      const { data } = await api.get<Funcionario[]>('/api/funcionarios');
      setFuncionarios(data);
    } catch (err) {
      setErroApi(erroMsg(err, 'Não foi possível carregar os funcionários.'));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const mostrarSucesso = (msg: string) => {
    setSucesso(msg);
    setTimeout(() => setSucesso(''), 3000);
  };

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const abrirCriar = () => {
    setEditando(null);
    setForm(FORM_VAZIO);
    setErroModal('');
    setModalAberto(true);
  };

  const abrirEditar = (f: Funcionario) => {
    setEditando(f);
    setForm({ nome: f.nome, email: f.email, nivelAcesso: f.nivelAcesso, senha: '' });
    setErroModal('');
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setForm(FORM_VAZIO);
    setErroModal('');
  };

  // ── Salvar (criar ou editar) ─────────────────────────────────────────────────
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroModal('');

    if (!form.nome.trim() || !form.email.trim()) {
      setErroModal('Nome e e-mail são obrigatórios.');
      return;
    }
    if (!editando && !form.senha.trim()) {
      setErroModal('A senha é obrigatória para novos funcionários.');
      return;
    }
    if (!editando && form.senha.length < 6) {
      setErroModal('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSalvando(true);
    try {
      if (editando) {
        await api.put(`/api/funcionarios/${editando.id}`, {
          nome: form.nome.trim(),
          email: form.email.trim(),
          nivelAcesso: form.nivelAcesso,
        });
        mostrarSucesso('Funcionário atualizado com sucesso!');
      } else {
        await api.post('/api/funcionarios', {
          nome: form.nome.trim(),
          email: form.email.trim(),
          nivelAcesso: form.nivelAcesso,
          senha: form.senha,
        });
        mostrarSucesso('Funcionário criado com sucesso!');
      }
      fecharModal();
      carregarFuncionarios();
    } catch (err) {
      setErroModal(erroMsg(err, 'Não foi possível salvar. Verifique os dados e tente novamente.'));
    } finally {
      setSalvando(false);
    }
  };

  // ── Toggle ativo/inativo ─────────────────────────────────────────────────────
  const handleToggle = async (f: Funcionario) => {
    setErroApi('');
    try {
      await api.patch(`/api/funcionarios/${f.id}/toggle-ativo`);
      mostrarSucesso(f.ativo ? 'Funcionário desativado.' : 'Funcionário ativado.');
      carregarFuncionarios();
    } catch (err) {
      setErroApi(erroMsg(err, 'Não foi possível alterar o status do funcionário.'));
    }
  };

  // ── Badges ───────────────────────────────────────────────────────────────────
  const badgeStatus = (ativo: boolean) => (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
      color: ativo ? 'var(--success)' : 'var(--muted)',
      background: ativo ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'var(--surface-2)',
    }}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );

  const badgePerfil = (nivel: NivelAcesso) => (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
      color: nivel === 'ADMIN' ? 'var(--accent)' : 'var(--muted)',
      background: nivel === 'ADMIN' ? 'var(--accent-sub)' : 'var(--surface-2)',
      letterSpacing: '0.04em',
    }}>
      {nivel === 'ADMIN' ? 'Admin' : 'Funcionário'}
    </span>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <section>
      {/* Page header */}
      <div className="page-title card">
        <div>
          <h2>Funcionários</h2>
          <p>Gerencie os usuários do sistema — crie, edite e ative/desative contas.</p>
        </div>
        <button className="btn btn-primary" onClick={abrirCriar} style={{ whiteSpace: 'nowrap' }}>
          + Novo Funcionário
        </button>
      </div>

      {/* Alerts */}
      {erroApi && (
        <div className="alert alert-error" style={{ marginBottom: 14 }}>
          <span>{erroApi}</span>
        </div>
      )}
      {sucesso && (
        <div className="alert alert-success" style={{ marginBottom: 14 }}>
          <span>✓ {sucesso}</span>
        </div>
      )}

      {/* Table card */}
      <section className="card settings-panel">
        {carregando ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Carregando…</p>
        ) : funcionarios.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhum funcionário cadastrado.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map(f => (
                  <tr key={f.id}>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{f.nome}</strong>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{f.email}</td>
                    <td>{badgePerfil(f.nivelAcesso)}</td>
                    <td>{badgeStatus(f.ativo)}</td>
                    <td>
                      <button
                        className="btn btn-ghost mini"
                        onClick={() => abrirEditar(f)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-ghost mini"
                        style={{ color: f.ativo ? 'var(--warning)' : 'var(--success)' }}
                        onClick={() => handleToggle(f)}
                      >
                        {f.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create / Edit modal */}
      {modalAberto && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && fecharModal()}>
          <section className="modal">
            <div className="modal-header">
              <h3>{editando ? 'Editar Funcionário' : 'Novo Funcionário'}</h3>
              <p>{editando ? 'Altere os dados do funcionário.' : 'Preencha os dados do novo funcionário.'}</p>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSalvar}>
                {erroModal && (
                  <div className="alert alert-error" style={{ marginBottom: 14 }}>
                    <span>{erroModal}</span>
                  </div>
                )}

                <div className="row row-2">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={e => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </label>
                  <label className="field">
                    <span>E-mail</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Perfil de Acesso</span>
                  <select
                    value={form.nivelAcesso}
                    onChange={e => setForm({ ...form, nivelAcesso: e.target.value as NivelAcesso })}
                  >
                    <option value="FUNCIONARIO">Funcionário</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>

                {!editando && (
                  <label className="field">
                    <span>Senha</span>
                    <input
                      type="password"
                      value={form.senha}
                      onChange={e => setForm({ ...form, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                    />
                  </label>
                )}

                <div className="modal-footer">
                  <button type="button" className="btn btn-ghost" onClick={fecharModal} disabled={salvando}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={salvando}>
                    {salvando ? 'Salvando…' : editando ? 'Salvar Alterações' : 'Criar Funcionário'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
