import React, { useMemo, useState } from 'react';
import { useParking, ParkingSpot } from '../../context/ParkingContext';
import { dataHora, duracao } from '../../utils';

const statusClass: Record<ParkingSpot['status'], string> = {
  Livre: 'free',
  Reservada: 'reserved',
  Ocupada: 'occupied',
  Expirada: 'expired',
  Inativa: 'inactive',
};

const statusLegend = [
  { status: 'Livre', label: 'Livre', cls: 'free' },
  { status: 'Reservada', label: 'Reservada', cls: 'reserved' },
  { status: 'Ocupada', label: 'Ocupada', cls: 'occupied' },
  { status: 'Expirada', label: 'Expirada', cls: 'expired' },
  { status: 'Inativa', label: 'Inativa', cls: 'inactive' },
];

export default function MapaVagas() {
  const { vagas, metricas, marcarChegada, cancelarReservaExpirada, calcularTempo, loading } = useParking();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<ParkingSpot['status'] | 'Todos'>('Todos');
  const [detalhe, setDetalhe] = useState<ParkingSpot | null>(null);

  const vagasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vagas.filter(v => {
      if (filtroStatus !== 'Todos' && v.status !== filtroStatus) return false;
      if (!termo) return true;
      return (
        v.codigo.toLowerCase().includes(termo) ||
        (v.placa ?? '').toLowerCase().includes(termo) ||
        (v.cliente ?? '').toLowerCase().includes(termo)
      );
    });
  }, [busca, vagas, filtroStatus]);

  const abrirDetalhe = (v: ParkingSpot) => {
    if (v.status === 'Livre') return;
    setDetalhe(v);
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--muted)' }}>
      Carregando dados...
    </div>
  );

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Mapa de Vagas</h2>
          <p>Visualização completa e interativa do estacionamento em tempo real.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="mapa-stat" style={{ color: 'var(--success)' }}>🟢 {metricas.livres} Livres</span>
          <span className="mapa-stat" style={{ color: 'var(--warning)' }}>🟡 {metricas.reservadas} Reservadas</span>
          <span className="mapa-stat" style={{ color: 'var(--danger)' }}>🔴 {metricas.ocupadas} Ocupadas</span>
        </div>
      </div>

      {/* Legenda */}
      <div className="mapa-legenda card">
        {statusLegend.map(l => (
          <div key={l.status} className="legenda-item">
            <span className={`legenda-dot spot-mini ${l.cls}`}></span>
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="reservas-toolbar">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar vaga por código, placa ou cliente..."
          style={{ flex: 1 }}
        />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} style={{ width: 180 }}>
          <option value="Todos">Todos os status</option>
          <option value="Livre">Livres</option>
          <option value="Reservada">Reservadas</option>
          <option value="Ocupada">Ocupadas</option>
          <option value="Expirada">Expiradas</option>
          <option value="Inativa">Inativas</option>
        </select>
      </div>

      {/* Grade do mapa */}
      <div className="lot-grid">
        {vagasFiltradas.map(v => {
          const tempo = calcularTempo(v.entrada);
          const atrasada = v.status === 'Ocupada' && v.saidaPrevista && new Date(v.saidaPrevista) < new Date();
          return (
            <button
              key={v.id}
              className={`spot ${statusClass[v.status]}`}
              onClick={() => abrirDetalhe(v)}
              title={v.status === 'Livre' ? 'Vaga disponível' : `${v.cliente} — ${v.placa}`}
            >
              <span className="badge">{v.status}</span>
              <span className="spot-tipo-badge">{v.tipo}</span>
              <h3>Vaga {v.codigo}</h3>
              {v.status === 'Livre' ? (
                <p>Disponível</p>
              ) : v.status === 'Inativa' ? (
                <p>Desativada</p>
              ) : (
                <div>
                  <p><strong>Placa:</strong> {v.placa}</p>
                  <p><strong>Entrada:</strong> {dataHora(v.entrada)}</p>
                  <p><strong>Tempo:</strong> {duracao(tempo)}</p>
                </div>
              )}
              {(atrasada || v.status === 'Expirada') && <em>⚠️</em>}
            </button>
          );
        })}
      </div>

      {vagasFiltradas.length === 0 && (
        <div className="empty-state card">
          <div className="empty-icon">🗺️</div>
          <h3>Nenhuma vaga encontrada</h3>
          <p>Tente ajustar os filtros de busca.</p>
        </div>
      )}

      {/* Modal Detalhe */}
      {detalhe && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setDetalhe(null)}>
          <section className="modal">
            <div className="modal-header">
              <h3>Vaga {detalhe.codigo}</h3>
              <p>Status: {detalhe.status} · Tipo: {detalhe.tipo}</p>
            </div>
            <div className="modal-body">
              <div className="detail-list">
                <div className="detail-item"><span>Placa</span><strong>{detalhe.placa ?? '-'}</strong></div>
                <div className="detail-item"><span>Modelo</span><strong>{detalhe.modelo ?? '-'}</strong></div>
                <div className="detail-item"><span>Cliente</span><strong>{detalhe.cliente ?? '-'}</strong></div>
                <div className="detail-item"><span>Operador</span><strong>{detalhe.operador ?? '-'}</strong></div>
                <div className="detail-item"><span>Entrada</span><strong>{dataHora(detalhe.entrada)}</strong></div>
                <div className="detail-item"><span>Saída prevista</span><strong>{dataHora(detalhe.saidaPrevista)}</strong></div>
                <div className="detail-item"><span>Tempo corrido</span><strong>{duracao(calcularTempo(detalhe.entrada))}</strong></div>
                <div className="detail-item"><span>Tipo da Vaga</span><strong>{detalhe.tipo}</strong></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDetalhe(null)}>Fechar</button>
                {detalhe.status === 'Reservada' && (
                  <button className="btn btn-warning" onClick={() => { marcarChegada(detalhe.id); setDetalhe(null); }}>
                    ✓ Confirmar Chegada
                  </button>
                )}
                {detalhe.status === 'Expirada' && (
                  <button className="btn btn-danger" onClick={() => { cancelarReservaExpirada(detalhe.id); setDetalhe(null); }}>
                    Cancelar Reserva Expirada
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
