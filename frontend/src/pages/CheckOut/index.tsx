import React, { useMemo, useState } from 'react';
import { useParking, ParkingSpot } from '../../context/ParkingContext';
import { dataHora, duracao, moeda } from '../../utils';

export default function CheckOut() {
  const { vagas, finalizarPagamento, calcularTempo, calcularValor } = useParking();
  const [busca, setBusca] = useState('');
  const [selecionada, setSelecionada] = useState<ParkingSpot | null>(null);
  const [pagamento, setPagamento] = useState<'Dinheiro' | 'PIX' | 'Cartão'>('Dinheiro');
  const [confirmado, setConfirmado] = useState(false);

  const vagasOcupadas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vagas.filter(v => {
      if (v.status !== 'Ocupada') return false;
      if (!termo) return true;
      return (
        v.codigo.toLowerCase().includes(termo) ||
        (v.placa ?? '').toLowerCase().includes(termo) ||
        (v.cliente ?? '').toLowerCase().includes(termo)
      );
    });
  }, [busca, vagas]);

  const abrirCheckout = (v: ParkingSpot) => {
    setSelecionada(v);
    setPagamento('Dinheiro');
    setConfirmado(false);
  };

  const confirmarPagamento = () => {
    if (!selecionada) return;
    finalizarPagamento(selecionada.id, pagamento);
    setConfirmado(true);
    setTimeout(() => { setSelecionada(null); setConfirmado(false); }, 1800);
  };

  const tempoFormatado = selecionada ? calcularTempo(selecionada.entrada) : 0;
  const valorCalculado = selecionada ? calcularValor(selecionada.entrada) : 0;
  const isAtrasada = selecionada?.saidaPrevista ? new Date(selecionada.saidaPrevista) < new Date() : false;

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Check-out e Pagamento</h2>
          <p>Finalize o atendimento, calcule o valor e registre o pagamento.</p>
        </div>
        <span style={{ color: 'var(--accent)' }}>{vagasOcupadas.length} vagas ocupadas</span>
      </div>

      <div className="reservas-toolbar">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar vaga por placa, cliente ou código..."
          style={{ flex: 1 }}
        />
      </div>

      {vagasOcupadas.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🏁</div>
          <h3>Nenhuma vaga em atendimento</h3>
          <p>Não há veículos ocupando vagas no momento.</p>
        </div>
      ) : (
        <div className="checkout-grid">
          {vagasOcupadas.map(v => {
            const tempo = calcularTempo(v.entrada);
            const valor = calcularValor(v.entrada);
            const atrasada = v.saidaPrevista && new Date(v.saidaPrevista) < new Date();
            return (
              <div key={v.id} className={`checkout-card card ${atrasada ? 'checkout-late' : ''}`}>
                <div className="checkout-card-header">
                  <div>
                    <h3>Vaga {v.codigo} {atrasada && <span style={{ fontSize: 18 }}>⚠️</span>}</h3>
                    <small style={{ color: 'var(--muted)' }}>{v.tipo}</small>
                  </div>
                  <span className="valor-destaque">{moeda(valor)}</span>
                </div>
                <div className="checkout-info">
                  <div><span>Cliente</span><strong>{v.cliente}</strong></div>
                  <div><span>Placa</span><code>{v.placa}</code></div>
                  <div><span>Entrada</span><strong>{dataHora(v.entrada)}</strong></div>
                  <div><span>Tempo</span><strong style={{ color: atrasada ? 'var(--danger)' : 'var(--text)' }}>{duracao(tempo)}</strong></div>
                </div>
                {atrasada && <div className="checkout-alert">⚠️ Saída prevista ultrapassada</div>}
                <button className="btn btn-primary full" onClick={() => abrirCheckout(v)}>
                  Finalizar e Cobrar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Pagamento */}
      {selecionada && !confirmado && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setSelecionada(null)}>
          <section className="modal">
            <div className="modal-header">
              <h3>Finalizar Atendimento</h3>
              <p>Vaga {selecionada.codigo} — {selecionada.cliente}</p>
            </div>
            <div className="modal-body">
              <div className="detail-list">
                <div className="detail-item"><span>Placa</span><strong>{selecionada.placa}</strong></div>
                <div className="detail-item"><span>Modelo</span><strong>{selecionada.modelo}</strong></div>
                <div className="detail-item"><span>Horário de entrada</span><strong>{dataHora(selecionada.entrada)}</strong></div>
                <div className="detail-item"><span>Horário de saída</span><strong>{dataHora(new Date().toISOString())}</strong></div>
                <div className="detail-item"><span>Tempo total</span><strong>{duracao(tempoFormatado)}</strong></div>
                {isAtrasada && <div className="detail-item" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
                  <span>⚠️ Saída prevista em</span><strong style={{ color: 'var(--danger)' }}>{dataHora(selecionada.saidaPrevista)}</strong>
                </div>}
              </div>
              <div className="pay-highlight">
                <span>Valor total calculado</span>
                <strong>{moeda(valorCalculado)}</strong>
              </div>
              <label className="field" style={{ marginTop: 16 }}>
                <span>Forma de Pagamento</span>
                <div className="payment-options">
                  {(['Dinheiro', 'PIX', 'Cartão'] as const).map(p => (
                    <button
                      key={p}
                      className={`payment-btn ${pagamento === p ? 'payment-btn-active' : ''}`}
                      onClick={() => setPagamento(p)}
                    >
                      {p === 'Dinheiro' ? '💵' : p === 'PIX' ? '📱' : '💳'} {p}
                    </button>
                  ))}
                </div>
              </label>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setSelecionada(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={confirmarPagamento}>
                  Confirmar Pagamento e Liberar Vaga
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Confirmação visual */}
      {confirmado && (
        <div className="modal-backdrop">
          <section className="modal" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 22, marginBottom: 8 }}>Pagamento Confirmado!</h3>
            <p style={{ color: 'var(--muted)' }}>A vaga foi liberada com sucesso.</p>
          </section>
        </div>
      )}
    </section>
  );
}
