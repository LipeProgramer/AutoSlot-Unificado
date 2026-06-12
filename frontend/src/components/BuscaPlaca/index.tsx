import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParking } from '../../context/ParkingContext';
import { Search, X } from 'lucide-react';

type Props = { onClose: () => void };

export default function BuscaPlaca({ onClose }: Props) {
  const { vagas, historico } = useParking();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const q = query.trim().toUpperCase();

  const vagasMatch = q.length >= 2
    ? vagas.filter(v =>
        v.codigo?.toUpperCase().includes(q) ||
        v.placa?.toUpperCase().includes(q) ||
        v.cliente?.toUpperCase().includes(q)
      ).slice(0, 5)
    : [];

  const historicoMatch = q.length >= 2
    ? historico.filter(h =>
        h.placa?.toUpperCase().includes(q) ||
        h.cliente?.toUpperCase().includes(q)
      ).slice(0, 5)
    : [];

  const nada = q.length >= 2 && vagasMatch.length === 0 && historicoMatch.length === 0;

  function statusColor(s: string) {
    const m: Record<string, string> = {
      Livre: 'var(--success)',
      Reservada: 'var(--warning)',
      Ocupada: 'var(--danger)',
      Expirada: 'var(--purple)',
    };
    return m[s] ?? 'var(--muted)';
  }

  return (
    <div
      className="modal-backdrop"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 'min(560px,96vw)',
        background: 'var(--panel)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--line-strong)',
      }}>
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
          <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar placa, vaga ou cliente..."
            style={{ border: 'none', background: 'transparent', fontSize: 15, color: 'var(--text)', outline: 'none', flex: 1 }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Resultados */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {q.length < 2 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Digite ao menos 2 caracteres para buscar
            </div>
          )}

          {vagasMatch.length > 0 && (
            <>
              <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 800, color: 'var(--muted-2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Vagas</div>
              {vagasMatch.map(v => (
                <div
                  key={v.id}
                  onClick={() => { navigate('/mapa'); onClose(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--text)', minWidth: 48 }}>{v.codigo}</span>
                  <span style={{ flex: 1, color: 'var(--muted)', fontSize: 13 }}>{v.cliente || v.placa || '—'}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: `${statusColor(v.status)}18`, color: statusColor(v.status) }}>{v.status}</span>
                </div>
              ))}
            </>
          )}

          {historicoMatch.length > 0 && (
            <>
              <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 800, color: 'var(--muted-2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Histórico</div>
              {historicoMatch.map(h => (
                <div
                  key={h.id}
                  onClick={() => { navigate('/historico'); onClose(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--panel-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--text)', minWidth: 80 }}>{h.placa}</span>
                  <span style={{ flex: 1, color: 'var(--muted)', fontSize: 13 }}>{h.cliente || '—'}</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{h.pagamento}</span>
                </div>
              ))}
            </>
          )}

          {nada && (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Nenhum resultado para <strong style={{ color: 'var(--text)' }}>{query}</strong>
            </div>
          )}
        </div>

        <div style={{ padding: '8px 18px', borderTop: '1px solid var(--line)', display: 'flex', gap: 16, color: 'var(--muted-2)', fontSize: 11 }}>
          <span>
            <kbd style={{ background: 'var(--panel-3)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>Esc</kbd>
            {' '}Fechar
          </span>
        </div>
      </div>
    </div>
  );
}
