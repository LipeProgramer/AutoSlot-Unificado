import React, { useState } from 'react';
import api from '../../services/api';
import { Search, Car } from 'lucide-react';

type ReservaHistorico = {
  id: number;
  placa: string;
  nomeCliente: string;
  modeloVeiculo: string;
  status: string;
  horarioChegadaPrevisto: string;
  horarioChegadaReal: string;
  horarioSaidaPrevisto: string;
  horarioSaidaReal: string;
  criadoEm: string;
  vagaCodigo: string;
  vagaTipo: string;
  operadorNome: string;
};

function dataHora(s: string) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function duracao(minutos: number) {
  if (!minutos || minutos <= 0) return '—';
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function tempoTotal(entrada: string, saida: string) {
  if (!entrada || !saida) return '—';
  const diff = new Date(saida).getTime() - new Date(entrada).getTime();
  if (diff <= 0) return '—';
  return duracao(Math.round(diff / 60000));
}

function statusColor(s: string) {
  const m: Record<string, string> = {
    RESERVADA: 'var(--warning)', OCUPADA: 'var(--accent)',
    CONCLUIDA: 'var(--success)', CANCELADA: 'var(--muted)', EXPIRADA: 'var(--purple)',
  };
  return m[s?.toUpperCase()] ?? 'var(--muted)';
}

export default function HistoricoVeiculo() {
  const [query, setQuery] = useState('');
  const [tipo, setTipo] = useState<'placa' | 'cliente'>('placa');
  const [resultados, setResultados] = useState<ReservaHistorico[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [erro, setErro] = useState('');

  const buscar = async () => {
    const q = query.trim();
    if (!q) return;
    setBuscando(true);
    setErro('');
    setBuscou(false);
    try {
      const params = tipo === 'placa' ? `placa=${encodeURIComponent(q)}` : `cliente=${encodeURIComponent(q)}`;
      const { data } = await api.get<ReservaHistorico[]>(`/api/reservas/buscar?${params}`);
      setResultados(Array.isArray(data) ? data : []);
      setBuscou(true);
    } catch (e: any) {
      setErro(e?.response?.data?.mensagem ?? 'Erro ao buscar. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  };

  const btnStyle = (ativo: boolean) => ({
    padding: '8px 16px', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700 as const,
    background: ativo ? 'var(--accent)' : 'transparent',
    color: ativo ? '#fff' : 'var(--muted)',
    transition: 'all .15s',
  });

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Histórico de Veículos</h2>
          <p>Consulte o histórico completo de um veículo ou cliente.</p>
        </div>
      </div>

      {/* Busca */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)', flexShrink: 0 }}>
            <button onClick={() => setTipo('placa')} style={btnStyle(tipo === 'placa')}>🚗 Placa</button>
            <button onClick={() => setTipo('cliente')} style={btnStyle(tipo === 'cliente')}>👤 Cliente</button>
          </div>
          <input
            value={query}
            onChange={e => setQuery(tipo === 'placa' ? e.target.value.toUpperCase() : e.target.value)}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder={tipo === 'placa' ? 'Ex.: ABC-1234 ou BRA2E19' : 'Ex.: João Silva'}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="btn btn-primary" onClick={buscar} disabled={buscando || !query.trim()}>
            {buscando ? 'Buscando...' : <><Search size={14} /> Buscar</>}
          </button>
        </div>
        {erro && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 10 }}>{erro}</p>}
      </div>

      {/* Resultados */}
      {buscou && (
        <>
          {resultados.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Total de visitas', value: resultados.length },
                { label: 'Concluídas', value: resultados.filter(r => r.status?.toUpperCase() === 'CONCLUIDA').length },
                { label: 'Última visita', value: dataHora(resultados[0]?.criadoEm).split(' ')[0] ?? '—' },
                { label: 'Placa mais recente', value: resultados[0]?.placa || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="card" style={{ padding: '14px 20px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          )}

          {resultados.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)' }}>
              <Car size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ margin: 0 }}>Nenhuma reserva encontrada para <strong style={{ color: 'var(--text)' }}>{query}</strong></p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Cliente</th>
                      <th>Vaga</th>
                      <th>Entrada</th>
                      <th>Saída</th>
                      <th>Duração</th>
                      <th>Status</th>
                      <th>Operador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map(r => (
                      <tr key={r.id}>
                        <td>
                          <strong style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{r.placa || '—'}</strong>
                          {r.modeloVeiculo && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.modeloVeiculo}</div>}
                        </td>
                        <td style={{ fontSize: 13 }}>{r.nomeCliente || '—'}</td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'var(--accent-sub)', color: 'var(--accent)' }}>
                            {r.vagaCodigo || '—'}
                          </span>
                          {r.vagaTipo && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{r.vagaTipo}</div>}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{dataHora(r.horarioChegadaReal || r.horarioChegadaPrevisto)}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{dataHora(r.horarioSaidaReal || r.horarioSaidaPrevisto)}</td>
                        <td style={{ fontSize: 12 }}>{tempoTotal(r.horarioChegadaReal || r.horarioChegadaPrevisto, r.horarioSaidaReal || r.horarioSaidaPrevisto)}</td>
                        <td>
                          <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: `${statusColor(r.status)}18`, color: statusColor(r.status) }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{r.operadorNome || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
