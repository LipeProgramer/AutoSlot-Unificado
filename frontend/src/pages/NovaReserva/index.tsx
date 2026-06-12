import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParking } from '../../context/ParkingContext';
import { toDateTimeLocal } from '../../utils';

// ── Formatação de placa ────────────────────────────────────────────────
function formatarPlacaAntiga(valor: string) {
  const limpo = valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  const letras = limpo.slice(0, 3).replace(/[^A-Z]/g, '');
  const numeros = limpo.slice(3).replace(/[^0-9]/g, '').slice(0, 4);
  if (letras.length <= 2) return letras;
  return numeros ? `${letras}-${numeros}` : `${letras}`;
}

function formatarPlacaMercosul(valor: string) {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

function placaAntigaValida(placa: string) {
  return /^[A-Z]{3}-\d{4}$/.test(placa);
}

function placaMercosulValida(placa: string) {
  return /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placa);
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
  const [tipoPlaca, setTipoPlaca] = useState<'antigo' | 'mercosul'>('antigo');

  // BUG FIX: sincroniza vagaId quando vagas carregam de forma assíncrona.
  useEffect(() => {
    if (vagasLivres.length > 0) {
      setForm(f => {
        const vagaAindaDisponivel = vagasLivres.some(v => v.id === f.vagaId);
        if (!vagaAindaDisponivel) return { ...f, vagaId: vagasLivres[0].id };
        return f;
      });
    }
  }, [vagasLivres]);

  const validar = () => {
    const novosErros: Record<string, string> = {};
    if (!nomeCompletoValido(form.cliente)) novosErros.cliente = 'Informe nome e sobrenome. Ex.: João Silva.';
    const placaUpper = form.placa.trim().toUpperCase();
    if (tipoPlaca === 'antigo') {
      if (!placaAntigaValida(placaUpper)) novosErros.placa = 'Placa antiga deve seguir o formato ABC-1234.';
    } else {
      if (!placaMercosulValida(placaUpper)) novosErros.placa = 'Placa Mercosul deve seguir o formato ABC1D23 (ex: BRA2E19).';
    }
    if (!form.modelo.trim()) novosErros.modelo = 'Informe o modelo do veículo. Ex.: Honda Civic.';
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

  const btnStyle = (ativo: boolean) => ({
    padding: '3px 10px', fontSize: 11, fontWeight: 700 as const,
    borderRadius: 6, border: '1.5px solid', cursor: 'pointer',
    borderColor: ativo ? 'var(--accent)' : 'var(--line)',
    background: ativo ? 'var(--accent)' : 'transparent',
    color: ativo ? '#fff' : 'var(--muted)',
    transition: 'all .15s',
  });

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ margin: 0 }}>Placa do veículo *</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => { setTipoPlaca('antigo'); setForm(f => ({ ...f, placa: '' })); setErros(e => ({ ...e, placa: '' })); }} style={btnStyle(tipoPlaca === 'antigo')}>Modelo Antigo</button>
                  <button type="button" onClick={() => { setTipoPlaca('mercosul'); setForm(f => ({ ...f, placa: '' })); setErros(e => ({ ...e, placa: '' })); }} style={btnStyle(tipoPlaca === 'mercosul')}>Mercosul</button>
                </div>
              </div>
              <input
                value={form.placa}
                onChange={e => {
                  const v = tipoPlaca === 'antigo' ? formatarPlacaAntiga(e.target.value) : formatarPlacaMercosul(e.target.value);
                  setForm(f => ({ ...f, placa: v }));
                  setErros(e2 => ({ ...e2, placa: '' }));
                }}
                placeholder={tipoPlaca === 'antigo' ? 'ABC-1234' : 'BRA2E19'}
                maxLength={tipoPlaca === 'antigo' ? 8 : 7}
              />
              {erros.placa && <small style={{ color: 'var(--danger)', fontSize: 12 }}>{erros.placa}</small>}
            </label>

            <label className="field">
              <span>Modelo do veículo *</span>
              <input
                value={form.modelo}
                onChange={e => { setForm(f => ({ ...f, modelo: e.target.value })); setErros(e2 => ({ ...e2, modelo: '' })); }}
                placeholder="Ex.: Honda Civic"
              />
              {erros.modelo && <small style={{ color: 'var(--danger)', fontSize: 12 }}>{erros.modelo}</small>}
            </label>

            <label className="field">
              <span>Vaga *</span>
              <select value={form.vagaId} onChange={e => { setForm(f => ({ ...f, vagaId: Number(e.target.value) })); setErros(e2 => ({ ...e2, vaga: '' })); }}>
                {vagasLivres.length === 0
                  ? <option value={0}>Nenhuma vaga disponível</option>
                  : vagasLivres.map(v => <option key={v.id} value={v.id}>{v.codigo} — {v.tipo}</option>)
                }
              </select>
              {erros.vaga && <small style={{ color: 'var(--danger)', fontSize: 12 }}>{erros.vaga}</small>}
            </label>

            <label className="field">
              <span>Horário de entrada *</span>
              <input type="datetime-local" value={form.entrada} onChange={e => setForm(f => ({ ...f, entrada: e.target.value }))} />
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
            <button className="btn btn-primary" onClick={confirmar} disabled={vagasLivres.length === 0}>Confirmar Reserva</button>
          </div>
        </div>

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
