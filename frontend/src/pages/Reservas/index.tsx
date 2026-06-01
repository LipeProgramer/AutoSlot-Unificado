import React, { useMemo, useState } from 'react';
import { useParking } from '../../context/ParkingContext';
import { dataHora, moeda, toDateTimeLocal } from '../../utils';

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

type EditModal = { vagaId: number; cliente: string; placa: string; modelo: string; saidaPrevista: string } | null;

export default function Reservas() {
  const { vagas, reservar, cancelarReserva, loading } = useParking();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'Todos' | 'Reservada' | 'Expirada'>('Todos');
  const [novaReservaAberta, setNovaReservaAberta] = useState(false);
  const [editModal, setEditModal] = useState<EditModal>(null);
  const [erroForm, setErroForm] = useState('');

  // Formulário nova reserva
  const vagasLivres = vagas.filter(v => v.status === 'Livre');
  const [form, setForm] = useState({
    cliente: '', placa: '', modelo: '',
    entrada: toDateTimeLocal(new Date()),
    saidaPrevista: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
    vagaId: vagasLivres[0]?.id ?? 0,
  });

  const reservasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vagas.filter(v => {
      if (v.status !== 'Reservada' && v.status !== 'Expirada') return false;
      if (filtroStatus !== 'Todos' && v.status !== filtroStatus) return false;
      if (!termo) return true;
      return (
        v.codigo.toLowerCase().includes(termo) ||
        (v.placa ?? '').toLowerCase().includes(termo) ||
        (v.cliente ?? '').toLowerCase().includes(termo)
      );
    });
  }, [busca, vagas, filtroStatus]);

  const abrirNova = () => {
    const primeiraLivre = vagasLivres[0];
    setErroForm(primeiraLivre ? '' : 'Não há vagas livres disponíveis.');
    setForm({
      cliente: '', placa: '', modelo: '',
      entrada: toDateTimeLocal(new Date()),
      saidaPrevista: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
      vagaId: primeiraLivre?.id ?? 0,
    });
    setNovaReservaAberta(true);
  };

  const confirmarNova = () => {
    const cliente = form.cliente.trim();
    const placa = form.placa.trim().toUpperCase();
    if (!nomeCompletoValido(cliente)) { setErroForm('Informe nome e sobrenome. Ex.: João Silva.'); return; }
    if (!placaValida(placa)) { setErroForm('Placa deve seguir o formato ABC-1234.'); return; }
    if (!form.vagaId) { setErroForm('Selecione uma vaga livre.'); return; }
    reservar({ ...form, cliente, placa });
    setNovaReservaAberta(false);
    setErroForm('');
  };

  const abrirEditar = (vagaId: number) => {
    const v = vagas.find(x => x.id === vagaId);
    if (!v) return;
    setEditModal({
      vagaId,
      cliente: v.cliente ?? '',
      placa: v.placa ?? '',
      modelo: v.modelo ?? '',
      saidaPrevista: v.saidaPrevista ? toDateTimeLocal(new Date(v.saidaPrevista)) : toDateTimeLocal(new Date()),
    });
  };

  const confirmarEditar = () => {
    if (!editModal) return;
    const v = vagas.find(x => x.id === editModal.vagaId);
    if (!v) return;
    reservar({
      cliente: editModal.cliente,
      placa: editModal.placa,
      modelo: editModal.modelo,
      entrada: v.entrada ?? new Date().toISOString(),
      saidaPrevista: editModal.saidaPrevista,
      vagaId: editModal.vagaId,
    });
    setEditModal(null);
  };

  const statusBadgeClass = (status: string) => {
    if (status === 'Reservada') return 'status-badge status-reserved';
    if (status === 'Expirada') return 'status-badge status-expired';
    return 'status-badge';
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
          <h2>Reservas</h2>
          <p>Gerencie reservas ativas, edite horários e cancele quando necessário.</p>
        </div>
      </div>

      <div className="reservas-toolbar">
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por placa, cliente ou vaga..."
          style={{ flex: 1 }}
        />
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as typeof filtroStatus)} style={{ width: 160 }}>
          <option value="Todos">Todos os status</option>
          <option value="Reservada">Reservadas</option>
          <option value="Expirada">Expiradas</option>
        </select>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Vaga</th>
              <th>Status</th>
              <th>Cliente</th>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Entrada Prev.</th>
              <th>Saída Prev.</th>
              <th>Operador</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {reservasFiltradas.length ? reservasFiltradas.map(v => (
              <tr key={v.id}>
                <td><strong style={{ color: 'var(--text)' }}>{v.codigo}</strong></td>
                <td><span className={statusBadgeClass(v.status)}>{v.status}</span></td>
                <td>{v.cliente ?? '-'}</td>
                <td><code style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>{v.placa ?? '-'}</code></td>
                <td>{v.modelo ?? '-'}</td>
                <td>{dataHora(v.entrada)}</td>
                <td>{dataHora(v.saidaPrevista)}</td>
                <td>{v.operador ?? '-'}</td>
                <td>
                  <button className="btn btn-ghost mini" onClick={() => abrirEditar(v.id)}>Editar</button>
                  <button className="btn btn-danger mini" onClick={() => cancelarReserva(v.id)}>Cancelar</button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>Nenhuma reserva encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Reserva */}
      {novaReservaAberta && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setNovaReservaAberta(false)}>
          <section className="modal">
            <div className="modal-header">
              <h3>Nova Reserva</h3>
              <p>Preencha os dados do cliente e selecione uma vaga livre.</p>
            </div>
            <div className="modal-body">
              <div className="row row-2">
                <label className="field"><span>Nome completo *</span>
                  <input value={form.cliente} onChange={e => { setForm({ ...form, cliente: e.target.value }); setErroForm(''); }} placeholder="Ex.: João Silva" />
                </label>
                <label className="field"><span>Placa *</span>
                  <input value={form.placa} onChange={e => { setForm({ ...form, placa: formatarPlaca(e.target.value) }); setErroForm(''); }} placeholder="ABC-1234" maxLength={8} />
                </label>
                <label className="field"><span>Modelo</span>
                  <input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Ex.: Onix" />
                </label>
                <label className="field"><span>Vaga</span>
                  <select value={form.vagaId} onChange={e => setForm({ ...form, vagaId: Number(e.target.value) })}>
                    {vagasLivres.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.tipo}</option>)}
                  </select>
                </label>
                <label className="field"><span>Entrada prevista</span>
                  <input type="datetime-local" value={form.entrada} onChange={e => setForm({ ...form, entrada: e.target.value })} />
                </label>
                <label className="field"><span>Saída prevista</span>
                  <input type="datetime-local" value={form.saidaPrevista} onChange={e => setForm({ ...form, saidaPrevista: e.target.value })} />
                </label>
              </div>
              {erroForm && <div className="error-box">{erroForm}</div>}
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setNovaReservaAberta(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={confirmarNova}>Confirmar Reserva</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal Editar Reserva */}
      {editModal && (
        <div className="modal-backdrop" onMouseDown={e => e.currentTarget === e.target && setEditModal(null)}>
          <section className="modal">
            <div className="modal-header">
              <h3>Editar Reserva</h3>
              <p>Altere os dados da reserva conforme necessário.</p>
            </div>
            <div className="modal-body">
              <div className="row row-2">
                <label className="field"><span>Nome do cliente</span>
                  <input value={editModal.cliente} onChange={e => setEditModal({ ...editModal, cliente: e.target.value })} />
                </label>
                <label className="field"><span>Placa</span>
                  <input value={editModal.placa} onChange={e => setEditModal({ ...editModal, placa: formatarPlaca(e.target.value) })} maxLength={8} />
                </label>
                <label className="field"><span>Modelo</span>
                  <input value={editModal.modelo} onChange={e => setEditModal({ ...editModal, modelo: e.target.value })} />
                </label>
                <label className="field"><span>Saída prevista</span>
                  <input type="datetime-local" value={editModal.saidaPrevista} onChange={e => setEditModal({ ...editModal, saidaPrevista: e.target.value })} />
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
    </section>
  );
}
