import React, { useEffect, useState } from 'react';
import { useParking, TipoVaga } from '../../context/ParkingContext';
import { dataHora, moeda } from '../../utils';
import api from '../../services/api';

// Extrai mensagem legível a partir do erro axios
function erroMsg(err: unknown, fallback: string): string {
  const e = err as { response?: { status?: number; data?: { mensagem?: string } } };
  if (e?.response?.status === 403) return 'Sem permissão de administrador. Faça login novamente.';
  if (e?.response?.status === 400 && e?.response?.data?.mensagem) return e.response.data.mensagem;
  return fallback;
}

const tiposVaga: TipoVaga[] = ['Normal', 'PCD', 'Idoso', 'Moto'];

type TarifaApi = {
  id: string | number;
  valorMinimo: number;
  valorIncremento: number;
  minutosFaixa: number;
  status: string;
  dataVigencia: string;
};

export default function Configuracoes() {
  const {
    vagas, configuracoes,
    adicionarVaga, editarVaga, inativarVaga, reativarVaga, excluirVaga,
    salvarConfiguracoes,
  } = useParking();

  // Inicializa com os valores que vêm do ParkingContext (carregados da API)
  const [valorHora, setValorHora] = useState(String(configuracoes.valorHora || ''));
  const [tolerancia, setTolerancia] = useState(String(configuracoes.toleranciaMinutos || ''));
  const [tarifaSalva, setTarifaSalva] = useState(false);
  const [erroApi, setErroApi] = useState('');

  const [editModal, setEditModal] = useState<{ id: number; codigo: string; tipo: TipoVaga } | null>(null);
  const [novaVagaTipo, setNovaVagaTipo] = useState<TipoVaga>('Normal');
  const [confirmExcluir, setConfirmExcluir] = useState<number | null>(null);

  // Sincroniza os campos de tarifa quando configuracoes mudar (após carregamento da API)
  useEffect(() => {
    setValorHora(String(configuracoes.valorHora || ''));
    setTolerancia(String(configuracoes.toleranciaMinutos || ''));
  }, [configuracoes.valorHora, configuracoes.toleranciaMinutos]);

  // Histórico de tarifas direto da API
  const [tarifasApi, setTarifasApi] = useState<TarifaApi[]>([]);

  useEffect(() => {
    api.get<{ tarifas?: TarifaApi[] } | TarifaApi[]>('/api/configuracoes/tarifas')
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : (data.tarifas ?? []);
        setTarifasApi(lista);
      })
      .catch(err => console.error('[Configuracoes] Erro ao buscar histórico de tarifas:', err));
  }, [tarifaSalva]); // recarrega após salvar nova tarifa

  const salvar = async () => {
    setErroApi('');
    try {
      await salvarConfiguracoes({ valorHora: Number(valorHora) || 0, toleranciaMinutos: Number(tolerancia) || 0 });
      setTarifaSalva(true);
      setTimeout(() => setTarifaSalva(false), 2500);
    } catch (err) {
      setErroApi(erroMsg(err, 'Não foi possível salvar a tarifa. Verifique a conexão com o servidor.'));
    }
  };

  const confirmarEditar = async () => {
    if (!editModal) return;
    setErroApi('');
    try {
      await editarVaga(editModal.id, editModal.codigo, editModal.tipo);
      setEditModal(null);
    } catch (err) {
      setErroApi(erroMsg(err, 'Não foi possível editar a vaga. Verifique a conexão com o servidor.'));
      setEditModal(null);
    }
  };

  const confirmarExcluir = async () => {
    if (confirmExcluir === null) return;
    setErroApi('');
    try {
      await excluirVaga(confirmExcluir);
      setConfirmExcluir(null);
    } catch (err) {
      setErroApi(erroMsg(err, 'Não foi possível excluir a vaga. Ela pode estar em uso.'));
      setConfirmExcluir(null);
    }
  };

  const statusBadge = (status: string) => {
    const cores: Record<string, string> = {
      Livre: 'var(--success)',
      Reservada: 'var(--warning)',
      Ocupada: 'var(--danger)',
      Expirada: 'var(--purple)',
      Inativa: 'var(--muted)',
    };
    return (
      <span style={{
        color: cores[status] ?? 'var(--muted)',
        fontWeight: 700, fontSize: 12,
        padding: '2px 8px', borderRadius: 99,
        background: `${cores[status] ?? 'var(--muted)'}18`,
      }}>
        {status}
      </span>
    );
  };

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Configurações</h2>
          <p>Acesso exclusivo do administrador. Gerencie vagas e tarifas do sistema.</p>
        </div>
      </div>

      <div className="settings-grid" style={{ gridTemplateColumns: '1.4fr 0.6fr' }}>
        {/* ── Gestão de Vagas ─────────────────────────────────────── */}
        <section className="card settings-panel">
          {erroApi && (
            <div className="alert alert-error" style={{ marginBottom: 14 }}>
              <span>{erroApi}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Gestão de Vagas</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={novaVagaTipo}
                onChange={e => setNovaVagaTipo(e.target.value as TipoVaga)}
                style={{ width: 120, padding: '6px 10px' }}
              >
                {tiposVaga.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button
                className="btn btn-primary mini-action"
                onClick={async () => {
                  setErroApi('');
                  try { await adicionarVaga(novaVagaTipo); }
                  catch (err) { setErroApi(erroMsg(err, 'Não foi possível adicionar a vaga. Verifique a conexão com o servidor.')); }
                }}
              >
                + Adicionar Vaga
              </button>
            </div>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vagas.map(vaga => (
                  <tr key={vaga.id}>
                    <td><strong style={{ color: 'var(--text)', fontFamily: 'DM Mono, monospace' }}>{vaga.codigo}</strong></td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: 'var(--accent-sub)', color: 'var(--accent)',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        {vaga.tipo}
                      </span>
                    </td>
                    <td>{statusBadge(vaga.status)}</td>
                    <td>
                      <button
                        className="btn btn-ghost mini"
                        onClick={() => setEditModal({ id: vaga.id, codigo: vaga.codigo, tipo: vaga.tipo })}
                        disabled={vaga.status === 'Ocupada' || vaga.status === 'Reservada'}
                      >
                        Editar
                      </button>
                      {vaga.status === 'Inativa' ? (
                        <button
                          className="btn btn-ghost mini"
                          style={{ color: 'var(--success)' }}
                          onClick={async () => {
                            setErroApi('');
                            try { await reativarVaga(vaga.id); }
                            catch { setErroApi('Não foi possível reativar a vaga.'); }
                          }}
                        >
                          Reativar
                        </button>
                      ) : (
                        <button
                          className="btn btn-ghost mini"
                          style={{ color: 'var(--warning)' }}
                          onClick={async () => {
                            setErroApi('');
                            try { await inativarVaga(vaga.id); }
                            catch { setErroApi('Não foi possível inativar a vaga.'); }
                          }}
                          disabled={vaga.status === 'Ocupada' || vaga.status === 'Reservada'}
                        >
                          Inativar
                        </button>
                      )}
                      <button
                        className="btn btn-danger mini"
                        onClick={() => setConfirmExcluir(vaga.id)}
                        disabled={vaga.status === 'Ocupada' || vaga.status === 'Reservada'}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Tarifas ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'start', minWidth: 0, overflow: 'hidden' }}>
          <section className="card settings-panel">
            <h3>Configuração de Tarifa</h3>
            <label className="field">
              <span>Valor da hora (R$)</span>
              <input value={valorHora} onChange={e => setValorHora(e.target.value)} type="number" min="0" step="0.01" />
            </label>
            <label className="field">
              <span>Minutos de tolerância</span>
              <input value={tolerancia} onChange={e => setTolerancia(e.target.value)} type="number" min="0" />
            </label>
            <button className="btn btn-primary" style={{ marginTop: 12, width: '100%' }} onClick={salvar}>
              {tarifaSalva ? '✓ Salvo!' : 'Salvar Tarifa'}
            </button>
          </section>

          <section className="card settings-panel">
            <h3 style={{ marginBottom: 14 }}>Histórico de Tarifas</h3>
            {tarifasApi.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma tarifa cadastrada.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Valor/hora</th>
                      <th>Faixa (min)</th>
                      <th>Status</th>
                      <th>Vigência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarifasApi.map(t => {
                      const ativa = String(t.status).toUpperCase() === 'ATIVA';
                      return (
                        <tr key={t.id}>
                          <td>
                            <strong style={{ color: 'var(--text)' }}>{moeda(t.valorIncremento ?? t.valorMinimo)}/h</strong>
                          </td>
                          <td style={{ color: 'var(--muted)', fontSize: 12 }}>{t.minutosFaixa} min</td>
                          <td>
                            <span style={{
                              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                              color: ativa ? 'var(--accent)' : 'var(--muted)',
                              background: ativa ? 'var(--accent-sub)' : 'var(--surface-2)',
                            }}>
                              {t.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{dataHora(t.dataVigencia)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal Editar Vaga */}
      {editModal && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setEditModal(null)}>
          <section className="modal">
            <div className="modal-header">
              <h3>Editar Vaga</h3>
              <p>Altere o código e/ou tipo da vaga.</p>
            </div>
            <div className="modal-body">
              <div className="row row-2">
                <label className="field">
                  <span>Código da Vaga</span>
                  <input
                    value={editModal.codigo}
                    onChange={e => setEditModal({ ...editModal, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ex.: A01"
                  />
                </label>
                <label className="field">
                  <span>Tipo</span>
                  <select value={editModal.tipo} onChange={e => setEditModal({ ...editModal, tipo: e.target.value as TipoVaga })}>
                    {tiposVaga.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={confirmarEditar}>Salvar Alterações</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {confirmExcluir !== null && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setConfirmExcluir(null)}>
          <section className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--muted)', marginBottom: 20 }}>
                Tem certeza que deseja excluir permanentemente a vaga{' '}
                <strong style={{ color: 'var(--text)' }}>
                  {vagas.find(v => v.id === confirmExcluir)?.codigo}
                </strong>?
                Esta ação não pode ser desfeita.
              </p>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setConfirmExcluir(null)}>Cancelar</button>
                <button className="btn btn-danger" style={{ background: 'var(--danger)', color: '#fff' }} onClick={confirmarExcluir}>
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
