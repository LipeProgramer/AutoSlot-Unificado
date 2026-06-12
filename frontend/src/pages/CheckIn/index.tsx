import React, { useMemo, useState } from 'react';
import { useParking, ParkingSpot } from '../../context/ParkingContext';
import { dataHora, duracao, toDateTimeLocal } from '../../utils';
import api from '../../services/api';

function formatarPlaca(valor: string) {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  const letras = limpo.slice(0, 3).replace(/[^A-Z]/g, '');
  const numeros = limpo.slice(3).replace(/[^0-9]/g, '').slice(0, 4);
  if (letras.length <= 2) return letras;
  return numeros ? `${letras}-${numeros}` : `${letras}-`;
}

function placaValida(placa: string) {
  return /^[A-Z]{3}-\d{4}$/.test(placa);
}

function nomeCompletoValido(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return partes.length >= 2 && partes.every(p => p.length >= 2);
}

export default function CheckIn() {
  const { vagas, marcarChegada, reservar } = useParking();
  const [busca, setBusca] = useState('');
  const [entradaAberta, setEntradaAberta] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [confirmando, setConfirmando] = useState<ParkingSpot | null>(null);

  const vagasLivres = vagas.filter(v => v.status === 'Livre');

  const [form, setForm] = useState({
    cliente: '', placa: '', modelo: '',
    entrada: toDateTimeLocal(new Date()),
    saidaPrevista: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
    vagaId: vagasLivres[0]?.id ?? 0,
  });

  // Vagas aguardando chegada (Reservadas) + expiradas
  const aguardandoChegada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vagas.filter(v => {
      if (v.status !== 'Reservada' && v.status !== 'Expirada') return false;
      if (!termo) return true;
      return (
        v.codigo.toLowerCase().includes(termo) ||
        (v.placa ?? '').toLowerCase().includes(termo) ||
        (v.cliente ?? '').toLowerCase().includes(termo)
      );
    });
  }, [busca, vagas]);

  const confirmarChegada = (v: ParkingSpot) => {
    marcarChegada(v.id);
    setConfirmando(null);
  };

  const confirmarEntradaDireta = () => {
    const cliente = form.cliente.trim();
    const placa = form.placa.trim().toUpperCase();
    if (!nomeCompletoValido(cliente)) { setErroForm('Informe nome e sobrenome. Ex.: João Silva.'); return; }
    if (!placaValida(placa)) { setErroForm('Placa deve seguir o formato ABC-1234.'); return; }
    if (!form.vagaId) { setErroForm('Selecione uma vaga livre.'); return; }
    // Cria a reserva e já marca chegada
    reservar({ ...form, cliente, placa });
    // Marca chegada na vaga escolhida
    setTimeout(() => marcarChegada(form.vagaId), 50);
    setEntradaAberta(false);
    setErroForm('');
  };

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Check-in</h2>
          <p>Confirme a chegada de clientes com reserva ou registre entradas diretas.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(f => ({ ...f, vagaId: vagasLivres[0]?.id ?? 0 })); setEntradaAberta(true); }}>
          + Entrada Direta
        </button>
      </div>

      <div className="reservas-toolbar">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar reserva por placa, cliente ou vaga..."
          style={{ flex: 1 }}
        />
        <div className="status-summary-chips">
          <span className="chip chip-reserved">{vagas.filter(v => v.status === 'Reservada').length} Aguardando</span>
          <span className="chip chip-expired">{vagas.filter(v => v.status === 'Expirada').length} Expiradas</span>
        </div>
      </div>

      {aguardandoChegada.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🎫</div>
          <h3>Nenhuma reserva aguardando chegada</h3>
          <p>Todas as vagas estão livres ou já em atendimento.</p>
        </div>
      ) : (
        <div className="checkin-grid">
          {aguardandoChegada.map(v => {
            const isExpirada = v.status === 'Expirada';
            return (
              <div key={v.id} className={`checkin-card card ${isExpirada ? 'checkin-expired' : ''}`}>
                <div className="checkin-card-header">
                  <div>
                    <span className={`status-badge ${isExpirada ? 'status-expired' : 'status-reserved'}`}>{v.status}</span>
                    <h3 style={{ marginTop: 8 }}>Vaga {v.codigo} <small style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 13 }}>— {v.tipo}</small></h3>
                  </div>
                  {isExpirada && <span style={{ fontSize: 24 }}>⚠️</span>}
                </div>
                <div className="checkin-info">
                  <div><span>Cliente</span><strong>{v.cliente}</strong></div>
                  <div><span>Placa</span><code>{v.placa}</code></div>
                  <div><span>Modelo</span><strong>{v.modelo}</strong></div>
                  <div><span>Entrada prev.</span><strong>{dataHora(v.entrada)}</strong></div>
                  <div><span>Saída prev.</span><strong>{dataHora(v.saidaPrevista)}</strong></div>
                  <div><span>Aguardando há</span><strong>{duracao(Math.max(0, Math.round((Date.now() - new Date(v.entrada ?? Date.now()).getTime()) / 60000)))}</strong></div>
                </div>
                <div className="checkin-actions">
                  <button className="btn btn-warning full" onClick={() => setConfirmando(v)}>✓ Confirmar Chegada</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Confirmar Chegada */}
      {confirmando && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setConfirmando(null)}>
          <section className="modal">
            <div className="modal-header">
              <h3>Confirmar Check-in</h3>
              <p>Vaga {confirmando.codigo} — {confirmando.cliente}</p>
            </div>
            <div className="modal-body">
              <div className="detail-list">
                <div className="detail-item"><span>Placa</span><strong>{confirmando.placa}</strong></div>
                <div className="detail-item"><span>Modelo</span><strong>{confirmando.modelo}</strong></div>
                <div className="detail-item"><span>Cliente</span><strong>{confirmando.cliente}</strong></div>
                <div className="detail-item"><span>Operador</span><strong>{confirmando.operador}</strong></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setConfirmando(null)}>Cancelar</button>
                <button className="btn btn-warning" onClick={() => confirmarChegada(confirmando)}>✓ Confirmar Chegada</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal Entrada Direta */}
      {entradaAberta && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setEntradaAberta(false)}>
          <section className="modal">
            <div className="modal-header">
              <h3>Entrada Direta (Sem Reserva)</h3>
              <p>O veículo entra diretamente sem reserva prévia.</p>
            </div>
            <div className="modal-body">
              <div className="row row-2">
                <label className="field"><span>Nome completo *</span>
                  <input value={form.cliente} onChange={e => { setForm(f => ({ ...f, cliente: e.target.value })); setErroForm(''); }} placeholder="Ex.: João Silva" />
                </label>
                <label className="field"><span>Placa *</span>
                  <input value={form.placa} onChange={e => { setForm(f => ({ ...f, placa: formatarPlaca(e.target.value) })); setErroForm(''); }} placeholder="ABC-1234" maxLength={8} />
                </label>
                <label className="field"><span>Modelo</span>
                  <input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Ex.: Onix" />
                </label>
                <label className="field"><span>Vaga</span>
                  <select value={form.vagaId} onChange={e => setForm(f => ({ ...f, vagaId: Number(e.target.value) }))}>
                    {vagasLivres.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.tipo}</option>)}
                  </select>
                </label>
                <label className="field"><span>Saída prevista</span>
                  <input type="datetime-local" value={form.saidaPrevista} onChange={e => setForm(f => ({ ...f, saidaPrevista: e.target.value }))} />
                </label>
              </div>
              {erroForm && <div className="error-box">{erroForm}</div>}
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setEntradaAberta(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={confirmarEntradaDireta}>Registrar Entrada</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
