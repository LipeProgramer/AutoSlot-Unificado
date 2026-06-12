import React from 'react';
import { useNotificacaoExpiracao } from '../../hooks/useNotificacaoExpiracao';
import { X, Clock } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, remover } = useNotificacaoExpiracao();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 100,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--panel)',
            border: `1px solid ${t.tipo === 'perigo' ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)'}`,
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 280, maxWidth: 360,
            animation: 'slideInRight 0.3s ease both',
          }}
        >
          <Clock size={16} style={{ color: t.tipo === 'perigo' ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>{t.mensagem}</span>
          <button
            onClick={() => remover(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2, flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
