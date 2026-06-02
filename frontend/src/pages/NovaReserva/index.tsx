import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParking } from '../../context/ParkingContext';
import { toDateTimeLocal } from '../../utils';

function formatarPlaca(valor: string) {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  const letras = limpo.slice(0, 3).replace(/[^A-Z]/g, '');
  const numeros = limpo.slice(3).replace(/[^0-9]/g, '').slice(0, 4);
  if (letras.length <= 2) return letras;
  return numeros ? `${letras}-${numeros}` : `${letras}`;
}

function placaValida(placa: string) {
  return /^[A-Z]{3}-\d{4}$/.test(placa);
}

function nomeCompletoValido(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return partes.length >= 2 && partes.every(p => p.length >= 2);
}

export default function NovaReserva() {
  const { vagas, reservar } = useParking();
  const navigate = useNavigate();

  const vagasLivres = vagas.filter(v => v.status === 'Livre');

  const [form, setForm] = useState({
    cliente: '',
    placa: '',
    modelo: '',
    entrada: toDateTimeLocal(new Date()),
    saidaPrevista: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
    vagaId: vagasLivres[0]?.id ?? 0,
  });

  const [erros, setErros] = useState<Record<string, string>>({});
  const [sucesso, setSucesso] = useState(false);

  const validar = () => {
    const novosErros: Record<string, string> = {};
    if (!nomeCompletoValido(form.cliente)) novosErros.cliente = 'Informe nome e sobrenome. Ex.: João Silva.';
    if (!placaValida(form.placa.trim().toUpperCase())) novosErros.placa = 'Placa deve seguir o formato ABC-1234.';
    if (!form.vagaId) novosErros.vaga = 'Selecione uma vaga livre.';
    const entrada = new Date(form.entrada);
    const saida = new Date(form.saidaPrevista);
    if (saida <= entrada) novosErros.saidaPrevista = 'A saída deve ser após a entrada.';
    return novosErros;
  };

  const confirmar = () => {
    const errosValidacao = validar();
    if (Object.keys(errosValidacao).length > 0) { setErros(errosValidacao); return; }
    reservar({ ...form, cliente: form.cliente.trim(), placa: form.placa.trim().toUpperCase() });
    setSucesso(true);
    setTimeout(() => navigate('/reservas'), 2000);
  };

  const vagaSelecionada = vagas.find(v => v.id === form.vagaId);

  if (sucesso) {
    return (
      <div className="empty-state card" style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div className="empty-icon">✅</div>
        <h3>Reserva criada com sucesso!</h3>
        <p>Redirecionando para a página de reservas...</p>
      </div>
    );
  }

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Nova Reserva</h2>
          <p>Preencha os dados do cliente para registrar uma nova reserva de vaga.</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/reservas')}>← Voltar</button>
      </div>

      <div className="nova-reserva-layout">
        {/* Formulário */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 800 }}>Dados da Reserva</h3>

          <div className="row row-2">
            <label className="field">
              <span>Nome completo do cliente *</span>
              <input
                value={form.cliente}
                onChange={e => { setForm(f => ({ ...f, cliente: e.target.value })); setErros(e2 => ({ ...e2, cliente: '' })); }}
                placeholder="Ex.: João Silva"
              />
              {erros.cliente && <small style={{ color: 'var(--danger)', fontSize: 12 }}>{erros.cliente}</small>}
            </label>

            <label className="field">
              <span>Placa do veículo *</span>
              <input
                value={form.placa}
                onChange={e => { setForm(f => ({ ...f, placa: formatarPlaca(e.target.value) })); setErros(e2 => ({ ...e2, placa: '' })); }}
                placeholder="ABC-1234"
                maxLength={8}
              />
              {erros.placa && <small style={{ color: 'var(--danger)', fontSize: 12 }}>{erros.placa}</small>}
            </label>

            <label className="field">
              <span>Modelo do veículo</span>
              <input value={form.modelo} onChange={e => setForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Ex.: Honda Civic" />
            </label>

            <label className="field">
              <span>Vaga *</span>
              <select
                value={form.vagaId}
                onChange={e => { setForm(f => ({ ...f, vagaId: Number(e.target.value) })); setErros(e2 => ({ ...e2, vaga: '' })); }}
              >
                {vagasLivres.length === 0
                  ? <option value={0}>Nenhuma vaga disponível</option>
                  : vagasLivres.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.tipo}</option>)
                }
              </select>
              {erros.vaga && <small style={{ color: 'var(--danger)', fontSize: 12 }}>{erros.vaga}</small>}
            </label>

            <label className="field">
              <span>Horário de entrada *</span>
              <input
                type="datetime-local"
                value={form.entrada}
                onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))}
              />
            </label>

            <label className="field">
              <span>Horário previsto de saída *</span>
              <input
                type="datetime-local"
                value={form.saidaPrevista}
                onChange={e => { setForm(f => ({ ...f, saidaPrevista: e.target.value })); setErros(e2 => ({ ...e2, saidaPrevista: '' })); }}
              />
              {erros.saidaPrevista && <small style={{ color: 'var(--danger)', fontSize: 12 }}>{erros.saidaPrevista}</small>}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => navigate('/reservas')}>Cancelar</button>
            <button className="btn btn-primary" onClick={confirmar} disabled={vagasLivres.length === 0}>
              Confirmar Reserva
            </button>
          </div>
        </div>

        {/* Preview da vaga selecionada */}
        <div>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 800 }}>Preview da Vaga</h3>
            {vagaSelecionada ? (
              <>
                <div className={`spot ${vagaSelecionada.status === 'Livre' ? 'free' : 'inactive'}`} style={{ cursor: 'default', marginBottom: 16 }}>
                  <span className="badge">{vagaSelecionada.status}</span>
                  <h3>Vaga {vagaSelecionada.codigo}</h3>
                  <p>Tipo: {vagaSelecionada.tipo}</p>
                  <p>Disponível para reserva</p>
                </div>
                <div className="detail-list" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="detail-item"><span>Código</span><strong>{vagaSelecionada.codigo}</strong></div>
                  <div className="detail-item"><span>Tipo</span><strong>{vagaSelecionada.tipo}</strong></div>
                  <div className="detail-item"><span>Status</span><strong>{vagaSelecionada.status}</strong></div>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
                <p>Selecione uma vaga ao lado</p>
              </div>
            )}
          </div>

          {/* Resumo */}
          {form.cliente && form.placa && (
            <div className="card" style={{ padding: '20px', marginTop: 12 }}>
              <h3 style={{ marginBottom: 14, fontSize: 15, fontWeight: 800 }}>Resumo</h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { label: 'Cliente', value: form.cliente || '-' },
                  { label: 'Placa', value: form.placa || '-' },
                  { label: 'Modelo', value: form.modelo || '-' },
                  { label: 'Vaga', value: vagaSelecionada?.codigo ?? '-' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                    <strong style={{ fontSize: 13 }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
