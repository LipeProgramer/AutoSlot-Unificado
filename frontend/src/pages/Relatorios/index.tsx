import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { dataHora, moeda } from '../../utils';
import api from '../../services/api';

// ─── Helpers de data ──────────────────────────────────────────────────────────

function primeiroDiaMes(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return toDateTimeLocal(d);
}

function hoje(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return toDateTimeLocal(d);
}

function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Tipos da API ─────────────────────────────────────────────────────────────

type Pagamento = {
  id: string | number;
  reservaId: string | number;
  valorCobrado: number;
  formaPagamento: string;
  registradoEm: string;
};

type FaturamentoResp = {
  total: number;
  ticketMedio: number;
  totalAtendimentos: number;
  porFormaPagamento: { DINHEIRO?: number; PIX?: number; CARTAO?: number };
  pagamentos: Pagamento[];
};

type OcupacaoResp = {
  percentualMedio: number;
  horasPico: { hora: string; percentual: number }[];
};

const labelPagamento: Record<string, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  CARTAO: 'Cartão',
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Relatorios() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'ADMIN';

  // Período
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes());
  const [dataFim, setDataFim] = useState(hoje());

  // Dados da API
  const [faturamento, setFaturamento] = useState<FaturamentoResp | null>(null);
  const [ocupacao, setOcupacao] = useState<OcupacaoResp | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtro local sobre os pagamentos
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function fetchRelatorios() {
      setLoading(true);
      try {
        const params = {
          inicio: new Date(dataInicio).toISOString(),
          fim: new Date(dataFim).toISOString(),
        };

        const [resFat, resOcup] = await Promise.allSettled([
          api.get<FaturamentoResp>('/api/relatorios/faturamento', { params }),
          api.get<OcupacaoResp>('/api/relatorios/ocupacao', { params }),
        ]);

        if (resFat.status === 'fulfilled') setFaturamento(resFat.value.data);
        if (resOcup.status === 'fulfilled') setOcupacao(resOcup.value.data);
      } catch (err) {
        console.error('[Relatorios] Erro ao buscar dados:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatorios();
  }, [dataInicio, dataFim]);

  // Filtro local dos pagamentos por forma ou data
  const pagamentosFiltrados = useMemo(() => {
    const lista = faturamento?.pagamentos ?? [];
    const termo = busca.trim().toLowerCase();
    if (!termo) return lista;
    return lista.filter(p =>
      String(p.reservaId).toLowerCase().includes(termo) ||
      (labelPagamento[p.formaPagamento] ?? p.formaPagamento).toLowerCase().includes(termo) ||
      dataHora(p.registradoEm).toLowerCase().includes(termo)
    );
  }, [faturamento, busca]);

  // Dados para os ChartCards de forma de pagamento
  const pfp = faturamento?.porFormaPagamento ?? {};
  const totalPfp = (pfp.DINHEIRO ?? 0) + (pfp.PIX ?? 0) + (pfp.CARTAO ?? 0) || 1;
  const barrasPagamento = [
    Math.round(((pfp.DINHEIRO ?? 0) / totalPfp) * 100),
    Math.round(((pfp.PIX ?? 0) / totalPfp) * 100),
    Math.round(((pfp.CARTAO ?? 0) / totalPfp) * 100),
  ];

  // Dados para o ChartCard de horários de pico
  const horasPico = ocupacao?.horasPico ?? [];
  const barrasPico = horasPico.slice(0, 4).map(h => Math.round(h.percentual));
  const labelsPico = horasPico.slice(0, 4).map(h => h.hora);

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Financeiro</h2>
          <p>
            {isAdmin
              ? 'Histórico completo com relatórios avançados e visão financeira global.'
              : 'Histórico simples restrito ao próprio turno do funcionário.'}
          </p>
        </div>
      </div>

      {/* Seletor de período */}
      <div className="filters" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label className="field" style={{ flex: 1, minWidth: 200 }}>
          <span>Início do período</span>
          <input
            type="datetime-local"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
          />
        </label>
        <label className="field" style={{ flex: 1, minWidth: 200 }}>
          <span>Fim do período</span>
          <input
            type="datetime-local"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
          />
        </label>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Filtrar por reserva, pagamento ou data…"
          style={{ flex: 2, minWidth: 220 }}
        />
      </div>

      {/* Cards de resumo */}
      <div className="summary-grid">
        <article>
          <span>Faturamento do período</span>
          <strong>{loading ? '…' : moeda(faturamento?.total ?? 0)}</strong>
        </article>
        <article>
          <span>Atendimentos</span>
          <strong>{loading ? '…' : (faturamento?.totalAtendimentos ?? 0)}</strong>
        </article>
        <article>
          <span>Ticket médio</span>
          <strong>{loading ? '…' : moeda(faturamento?.ticketMedio ?? 0)}</strong>
        </article>
        <article>
          <span>Taxa de ocupação média</span>
          <strong>{loading ? '…' : `${ocupacao?.percentualMedio ?? 0}%`}</strong>
        </article>
      </div>

      {/* Tabela de pagamentos */}
      <div className="table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
            Carregando dados do período…
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reserva</th>
                <th>Valor cobrado</th>
                <th>Forma de pagamento</th>
                <th>Data / Hora</th>
              </tr>
            </thead>
            <tbody>
              {pagamentosFiltrados.length ? pagamentosFiltrados.map(item => (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                    #{item.reservaId}
                  </td>
                  <td style={{ fontWeight: 700 }}>{moeda(item.valorCobrado)}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                      background: 'var(--surface-2)',
                      color: 'var(--text)',
                    }}>
                      {labelPagamento[item.formaPagamento] ?? item.formaPagamento}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {dataHora(item.registradoEm)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                    Nenhum pagamento encontrado para o período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ChartCards — apenas visuais, disponíveis somente para Admin */}
      {isAdmin && (
        <div className="chart-grid">
          <ChartCard
            title="Faturamento diário, semanal e mensal"
            bars={[45, 65, 90]}
            labels={['Dia', 'Semana', 'Mês']}
          />
          <ChartCard
            title="Faturamento por forma de pagamento"
            bars={barrasPagamento.length === 3 && barrasPagamento.some(b => b > 0)
              ? barrasPagamento
              : [55, 80, 70]}
            labels={['Dinheiro', 'PIX', 'Cartão']}
          />
          <ChartCard
            title="Desempenho por operador"
            bars={[60, 85, 72]}
            labels={['Felipe', 'Ana', 'Carlos']}
          />
          <ChartCard
            title="Horários de pico (taxa de ocupação)"
            bars={barrasPico.length > 0 ? barrasPico : [35, 68, 92]}
            labels={labelsPico.length > 0 ? labelsPico : ['08h', '12h', '18h']}
          />
        </div>
      )}
    </section>
  );
}

// ─── Subcomponente ChartCard ──────────────────────────────────────────────────

function ChartCard({ title, bars, labels }: { title: string; bars: number[]; labels: string[] }) {
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      <div className="bars">
        {bars.map((bar, index) => (
          <span key={labels[index]} style={{ height: `${bar}%` }}>
            <small>{labels[index]}</small>
          </span>
        ))}
      </div>
    </article>
  );
}
