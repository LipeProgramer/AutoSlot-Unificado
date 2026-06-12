import React from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useParking } from '../../context/ParkingContext';

const TOOLTIP_STYLE = {
  background: 'var(--panel)',
  border: '1px solid var(--line-strong)',
  borderRadius: 10,
  color: 'var(--text)',
  fontSize: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
};

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function GraficosReceita() {
  const { historico } = useParking();

  // Agrupa por dia (últimos 7 dias)
  const hoje = new Date();
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const porDia = dias.map(dia => {
    const items = historico.filter(h => h.data?.slice(0, 10) === dia);
    return {
      dia: new Date(dia + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      receita: items.reduce((s, h) => s + (h.valor ?? 0), 0),
      atendimentos: items.length,
    };
  });

  if (historico.length === 0) {
    return null;
  }

  return (
    <div className="chart-grid">
      {/* Receita por dia */}
      <div className="card chart-card">
        <h3>📈 Receita — últimos 7 dias</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={porDia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="dia" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `R$${v}`} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any) => moeda(Number(v ?? 0))}
              labelStyle={{ color: 'var(--text)', fontWeight: 700 }}
            />
            <Bar dataKey="receita" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Atendimentos por dia */}
      <div className="card chart-card">
        <h3>🚗 Atendimentos — últimos 7 dias</h3>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={porDia} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="dia" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any) => { const n = Number(v ?? 0); return `${n} atendimento${n !== 1 ? 's' : ''}`; }}
              labelStyle={{ color: 'var(--text)', fontWeight: 700 }}
            />
            <Line
              type="monotone"
              dataKey="atendimentos"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ fill: 'var(--accent)', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
