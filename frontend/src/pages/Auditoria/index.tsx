import React, { useEffect, useMemo, useState } from 'react';
import { AuditoriaItem } from '../../context/ParkingContext';
import { dataHora } from '../../utils';
import api from '../../services/api';

const acaoCores: Record<string, string> = {
  'LOGIN': 'var(--info)',
  'RESERVA': 'var(--warning)',
  'CHECK-IN': 'var(--success)',
  'CHECK-OUT': 'var(--accent)',
  'CANCELAMENTO': 'var(--danger)',
  'CANCELAMENTO EXPIRADO': 'var(--danger)',
  'VAGA CRIADA': 'var(--success)',
  'VAGA EDITADA': 'var(--info)',
  'VAGA INATIVADA': 'var(--muted)',
  'VAGA REATIVADA': 'var(--success)',
  'VAGA EXCLUÍDA': 'var(--danger)',
  'TARIFA ATUALIZADA': 'var(--purple)',
};

const acaoIcone: Record<string, string> = {
  'LOGIN': '🔐',
  'RESERVA': '📋',
  'CHECK-IN': '✅',
  'CHECK-OUT': '🏁',
  'CANCELAMENTO': '❌',
  'CANCELAMENTO EXPIRADO': '⚠️',
  'VAGA CRIADA': '➕',
  'VAGA EDITADA': '✏️',
  'VAGA INATIVADA': '🔒',
  'VAGA REATIVADA': '🔓',
  'VAGA EXCLUÍDA': '🗑️',
  'TARIFA ATUALIZADA': '💲',
};

// Formato do item retornado pela API
type LogAPI = {
  id: string | number;
  dataHora: string;
  usuario: { nome: string };
  acao: string;
  entidade: string;
  entidadeId?: string | number | null;
  resumo?: string;
};

type RespostaAPI = {
  logs: LogAPI[];
  pagination: { page: number; pageSize: number; total: number };
};

function mapearLog(l: LogAPI): AuditoriaItem {
  return {
    id: String(l.id),
    data: l.dataHora,
    usuario: l.usuario?.nome ?? '—',
    perfil: 'ADMIN', // A API não retorna perfil no log; usar 'ADMIN' como padrão
    acao: l.acao,
    recurso: l.entidade + (l.entidadeId != null ? ` #${l.entidadeId}` : ''),
    detalhe: l.resumo,
  };
}

export default function Auditoria() {
  const [logs, setLogs] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('Todos');
  const [filtroPerfil, setFiltroPerfil] = useState<'Todos' | 'ADMIN' | 'FUNCIONARIO'>('Todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 20;

  // Busca da API — re-executa quando filtros ou página mudam
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page: paginaAtual,
          pageSize: itensPorPagina,
        };
        if (filtroAcao !== 'Todos') params.acao = filtroAcao;
        if (filtroPerfil !== 'Todos') params.perfil = filtroPerfil;
        if (busca.trim()) params.q = busca.trim();

        const { data } = await api.get<RespostaAPI>('/api/auditoria', { params });

        setLogs((data.logs ?? []).map(mapearLog));
        setTotal(data.pagination?.total ?? 0);
      } catch (err) {
        console.error('[Auditoria] Erro ao buscar logs:', err);
        setLogs([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [paginaAtual, filtroAcao, filtroPerfil, busca]);

  const handleFiltroChange = () => setPaginaAtual(1);

  const acoesDisponiveis = useMemo(() => {
    const set = new Set(logs.map(a => a.acao));
    return ['Todos', ...Array.from(set)];
  }, [logs]);

  // Filtro local (aplicado sobre o que a API já devolveu para a página atual)
  const filtrado = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return logs.filter(item => {
      if (filtroAcao !== 'Todos' && item.acao !== filtroAcao) return false;
      if (filtroPerfil !== 'Todos' && item.perfil !== filtroPerfil) return false;
      if (!termo) return true;
      return (
        item.usuario.toLowerCase().includes(termo) ||
        item.acao.toLowerCase().includes(termo) ||
        item.recurso.toLowerCase().includes(termo) ||
        (item.detalhe ?? '').toLowerCase().includes(termo)
      );
    });
  }, [logs, busca, filtroAcao, filtroPerfil]);

  // Paginação — usa `total` da API para calcular total de páginas
  const totalPaginas = Math.ceil(total / itensPorPagina);

  // Métricas calculadas sobre os logs da página atual
  const hoje = new Date();
  const hojeStr = hoje.toDateString();
  const totalHoje = logs.filter(a => new Date(a.data).toDateString() === hojeStr).length;
  const totalAdmin = logs.filter(a => a.perfil === 'ADMIN').length;
  const totalFunc = logs.filter(a => a.perfil === 'FUNCIONARIO').length;

  return (
    <section>
      <div className="page-title card">
        <div>
          <h2>Auditoria do Sistema</h2>
          <p>Registro cronológico de todas as ações realizadas no sistema.</p>
        </div>
        <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>
          {total} registros totais
        </span>
      </div>

      {/* Métricas rápidas */}
      <div className="cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <article className="card metric">
          <span>Ações hoje</span>
          <strong>{totalHoje}</strong>
          <small>Registros do dia de hoje</small>
        </article>
        <article className="card metric">
          <span>Ações de Admins</span>
          <strong style={{ color: 'var(--accent)' }}>{totalAdmin}</strong>
          <small>Realizadas por administradores</small>
        </article>
        <article className="card metric">
          <span>Ações de Funcionários</span>
          <strong style={{ color: 'var(--info)' }}>{totalFunc}</strong>
          <small>Realizadas por funcionários</small>
        </article>
      </div>

      {/* Filtros */}
      <div className="reservas-toolbar">
        <input
          value={busca}
          onChange={e => { setBusca(e.target.value); handleFiltroChange(); }}
          placeholder="Buscar por usuário, ação, recurso ou detalhe..."
          style={{ flex: 1 }}
        />
        <select value={filtroAcao} onChange={e => { setFiltroAcao(e.target.value); handleFiltroChange(); }} style={{ width: 200 }}>
          {acoesDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filtroPerfil} onChange={e => { setFiltroPerfil(e.target.value as typeof filtroPerfil); handleFiltroChange(); }} style={{ width: 160 }}>
          <option value="Todos">Todos os perfis</option>
          <option value="ADMIN">Admin</option>
          <option value="FUNCIONARIO">Funcionário</option>
        </select>
      </div>

      {/* Timeline / Tabela */}
      <div className="table-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
            Carregando registros…
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data / Hora</th>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Ação</th>
                <th>Recurso</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {filtrado.length ? filtrado.map((item: AuditoriaItem) => (
                <tr key={item.id}>
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>
                    {dataHora(item.data)}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{item.usuario}</td>
                  <td>
                    <span className={`status-badge ${item.perfil === 'ADMIN' ? 'badge-admin' : 'badge-func'}`}>
                      {item.perfil}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: acaoCores[item.acao] ?? 'var(--text)',
                      fontWeight: 700, fontSize: 12, letterSpacing: '0.03em',
                    }}>
                      <span>{acaoIcone[item.acao] ?? '•'}</span>
                      {item.acao}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{item.recurso}</td>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{item.detalhe ?? '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                    Nenhum registro encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="paginacao">
          <button className="btn btn-ghost" onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual === 1}>
            ← Anterior
          </button>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            Página {paginaAtual} de {totalPaginas} · {total} registros
          </span>
          <button className="btn btn-ghost" onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual === totalPaginas}>
            Próxima →
          </button>
        </div>
      )}
    </section>
  );
}
