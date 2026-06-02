import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

// ─── Tipos exportados ────────────────────────────────────────────────────────

export type SpotStatus = 'Livre' | 'Reservada' | 'Ocupada' | 'Expirada' | 'Inativa';
export type TipoVaga = 'Normal' | 'PCD' | 'Idoso' | 'Moto';

export type ParkingSpot = {
  id: number;
  codigo: string;
  status: SpotStatus;
  tipo: TipoVaga;
  posX?: number;
  posY?: number;
  placa?: string;
  cliente?: string;
  modelo?: string;
  entrada?: string;
  saidaPrevista?: string;
  operador?: string;
  reservaId?: number;
};

export type HistoryItem = {
  id: string;
  placa: string;
  cliente: string;
  tempoMinutos: number;
  valor: number;
  pagamento: 'Dinheiro' | 'PIX' | 'Cartão';
  operador: string;
  data: string;
  vaga?: string;
};

export type AuditoriaItem = {
  id: string;
  data: string;
  usuario: string;
  perfil: 'ADMIN' | 'FUNCIONARIO';
  acao: string;
  recurso: string;
  detalhe?: string;
};

export type TarifaItem = {
  id: string;
  valorHora: number;
  toleranciaMinutos: number;
  ativa: boolean;
  criadoEm: string;
  criadoPor: string;
};

// ─── Tipos internos ───────────────────────────────────────────────────────────

type Settings = {
  valorHora: number;
  toleranciaMinutos: number;
};

type NewReservation = {
  cliente: string;
  placa: string;
  modelo: string;
  entrada: string;
  saidaPrevista: string;
  vagaId: number;
};

type ParkingContextData = {
  vagas: ParkingSpot[];
  historico: HistoryItem[];
  auditoria: AuditoriaItem[];
  historicoTarifas: TarifaItem[];
  configuracoes: Settings;
  loading: boolean;
  metricas: {
    livres: number;
    ocupadas: number;
    reservadas: number;
    faturamento: number;
    ticketMedio: number;
    ocupacao: number;
  };
  reservar: (dados: NewReservation) => Promise<void>;
  marcarChegada: (vagaId: number) => Promise<void>;
  cancelarReserva: (vagaId: number) => Promise<void>;
  cancelarReservaExpirada: (vagaId: number) => Promise<void>;
  finalizarPagamento: (vagaId: number, pagamento: HistoryItem['pagamento']) => Promise<void>;
  adicionarVaga: (tipo?: TipoVaga) => Promise<void>;
  editarVaga: (vagaId: number, codigo: string, tipo?: TipoVaga) => Promise<void>;
  inativarVaga: (vagaId: number) => Promise<void>;
  reativarVaga: (vagaId: number) => Promise<void>;
  excluirVaga: (vagaId: number) => Promise<void>;
  salvarConfiguracoes: (settings: Settings) => Promise<void>;
  calcularValor: (entrada?: string, saida?: string) => number;
  calcularTempo: (entrada?: string, saida?: string) => number;
  carregarVagas: () => Promise<void>;
};

// ─── Mapeadores back-end → front-end ─────────────────────────────────────────

function mapStatus(s: string): SpotStatus {
  const map: Record<string, SpotStatus> = {
    LIVRE: 'Livre',
    RESERVADA: 'Reservada',
    OCUPADA: 'Ocupada',
    INATIVA: 'Inativa',
    EXPIRADA: 'Expirada',
  };
  return map[s?.toUpperCase()] ?? 'Livre';
}

function mapTipo(t: string): TipoVaga {
  const map: Record<string, TipoVaga> = {
    NORMAL: 'Normal',
    COMUM: 'Normal',
    PCD: 'PCD',
    IDOSO: 'Idoso',
    MOTO: 'Moto',
  };
  return map[t?.toUpperCase()] ?? 'Normal';
}

function mapTipoParaApi(tipo: TipoVaga): string {
  const map: Record<TipoVaga, string> = {
    Normal: 'NORMAL',
    PCD: 'PCD',
    Idoso: 'IDOSO',
    Moto: 'MOTO',
  };
  return map[tipo] ?? 'NORMAL';
}

function mapPagamentoParaApi(pagamento: HistoryItem['pagamento']): string {
  const map: Record<HistoryItem['pagamento'], string> = {
    Dinheiro: 'DINHEIRO',
    PIX: 'PIX',
    Cartão: 'CARTAO',
  };
  return map[pagamento] ?? 'DINHEIRO';
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const ParkingContext = createContext<ParkingContextData>({} as ParkingContextData);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const { usuario, logado: authLogado, loading: authLoading } = useAuth();

  const [vagas, setVagas] = useState<ParkingSpot[]>([]);
  const [historico, setHistorico] = useState<HistoryItem[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaItem[]>([]);
  const [historicoTarifas, setHistoricoTarifas] = useState<TarifaItem[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Settings>({ valorHora: 0, toleranciaMinutos: 0 });
  const [loading, setLoading] = useState(true);

  // ── Carregamento de vagas ──────────────────────────────────────────────────

  const carregarVagas = useCallback(async () => {
    try {
      // 1. Lista base de vagas (exclui INATIVA por padrão)
      const { data: vagasData } = await api.get<{ vagas?: unknown[]; [key: string]: unknown }>('/api/vagas');

      // A API pode retornar { vagas: [...] } ou diretamente um array
      const vagasRaw: unknown[] = Array.isArray(vagasData)
        ? vagasData
        : (vagasData.vagas ?? []);

      // 1b. Busca vagas inativas separadamente (a API filtra INATIVA do default)
      const resInativas = await api.get<{ vagas?: unknown[]; [key: string]: unknown }>('/api/vagas?status=INATIVA').catch(() => ({ data: { vagas: [] as unknown[] } }));
      const inativasRaw: unknown[] = Array.isArray(resInativas.data)
        ? resInativas.data
        : ((resInativas.data as { vagas?: unknown[] }).vagas ?? []);

      // Merge sem duplicar (por id)
      const idsAtivas = new Set(vagasRaw.map(v => (v as Record<string, unknown>).id));
      const todasVagasRaw = [...vagasRaw, ...inativasRaw.filter(v => !idsAtivas.has((v as Record<string, unknown>).id))];

      // 2. Reservas ativas (RESERVADA e OCUPADA) em paralelo
      const [resReservadas, resOcupadas] = await Promise.allSettled([
        api.get<unknown[]>('/api/reservas?status=RESERVADA'),
        api.get<unknown[]>('/api/reservas?status=OCUPADA'),
      ]);

      const reservasAtivas: Record<string, unknown>[] = [];

      if (resReservadas.status === 'fulfilled') {
        const d = resReservadas.value.data;
        const lista = Array.isArray(d) ? d : ((d as { reservas?: unknown[] }).reservas ?? []);
        reservasAtivas.push(...(lista as Record<string, unknown>[]));
      }
      if (resOcupadas.status === 'fulfilled') {
        const d = resOcupadas.value.data;
        const lista = Array.isArray(d) ? d : ((d as { reservas?: unknown[] }).reservas ?? []);
        reservasAtivas.push(...(lista as Record<string, unknown>[]));
      }

      // 3. Cruzamento: indexar reservas por vagaId e vagaCodigo
      const reservaPorVagaId = new Map<number, Record<string, unknown>>();
      const reservaPorCodigo = new Map<string, Record<string, unknown>>();

      for (const r of reservasAtivas) {
        if (r.vagaId != null) reservaPorVagaId.set(Number(r.vagaId), r);
        const cod = (r.vagaIdentificacao ?? r.vagaCodigo) as string | undefined;
        if (cod) reservaPorCodigo.set(String(cod).toUpperCase(), r);
      }

      // 4. Mapear vagas cruzando com reservas
      const vagasMapeadas: ParkingSpot[] = (todasVagasRaw as Record<string, unknown>[]).map((v) => {
        const id = Number(v.id);
        const codigo = String(v.codigo ?? v.identificacao ?? '');
        const status = mapStatus(String(v.status ?? ''));
        const tipo = mapTipo(String(v.tipoVaga ?? v.tipo ?? ''));
        const posX = v.posicaoX != null ? Number(v.posicaoX) : v.posX != null ? Number(v.posX) : undefined;
        const posY = v.posicaoY != null ? Number(v.posicaoY) : v.posY != null ? Number(v.posY) : undefined;

        const reserva = reservaPorVagaId.get(id) ?? reservaPorCodigo.get(codigo.toUpperCase());

        if (reserva) {
          return {
            id,
            codigo,
            status,
            tipo,
            posX,
            posY,
            reservaId: Number(reserva.id),
            placa: String(reserva.placa ?? reserva.placaVeiculo ?? ''),
            cliente: String(reserva.nomeCliente ?? reserva.cliente ?? ''),
            modelo: String(reserva.modeloVeiculo ?? reserva.modelo ?? ''),
            entrada: String(reserva.horarioChegadaReal ?? reserva.horarioChegadaPrevisto ?? ''),
            saidaPrevista: String(reserva.horarioSaidaPrevisto ?? reserva.saidaPrevista ?? ''),
            operador: String(reserva.operador ?? reserva.nomeOperador ?? ''),
          };
        }

        return { id, codigo, status, tipo, posX, posY };
      });

      vagasMapeadas.sort((a, b) => a.id - b.id);
      setVagas(vagasMapeadas);
    } catch (err) {
      console.error('[ParkingContext] Erro ao carregar vagas:', err);
    }
  }, []);

  // ── Carregamento inicial ───────────────────────────────────────────────────
  // Aguarda o AuthContext terminar de restaurar o estado antes de buscar dados.
  // Isso evita race condition onde o ParkingContext lia o localStorage enquanto
  // o AuthContext ainda estava inicializando (loading=true), fazendo as vagas
  // sumirem após login/refresh.

  useEffect(() => {
    // Enquanto o AuthContext ainda está verificando o localStorage, não faz nada
    if (authLoading) return;

    async function init() {
      // Se não estiver logado, limpa o estado e encerra
      if (!authLogado) {
        setLoading(false);
        setVagas([]);
        return;
      }

      setLoading(true);
      try {
        await Promise.all([
          carregarVagas(),
          // Tarifa ativa — silenciar 404
          api.get('/api/configuracoes/tarifa-ativa')
            .then(({ data }) => {
              if (data?.valorHora != null) {
                setConfiguracoes({
                  valorHora: Number(data.valorHora),
                  toleranciaMinutos: Number(data.toleranciaMinutos ?? 0),
                });
              }
            })
            .catch((err) => {
              if (err?.response?.status !== 404) {
                console.error('[ParkingContext] Erro ao carregar tarifa ativa:', err);
              }
            }),
        ]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [authLoading, authLogado, carregarVagas]);

  // ── Funções de cálculo ────────────────────────────────────────────────────

  const calcularTempo = (entrada?: string, saida = new Date().toISOString()) => {
    if (!entrada) return 0;
    return Math.max(0, Math.round((new Date(saida).getTime() - new Date(entrada).getTime()) / 60000));
  };

  const calcularValor = (entrada?: string, saida = new Date().toISOString()) => {
    const minutos = calcularTempo(entrada, saida);
    const cobravel = Math.max(0, minutos - configuracoes.toleranciaMinutos);
    return Math.ceil(cobravel / 60) * configuracoes.valorHora;
  };

  // ── Métricas ──────────────────────────────────────────────────────────────

  const metricas = useMemo(() => {
    const ativas = vagas.filter(v => v.status !== 'Inativa');
    const ocupadas = vagas.filter(v => v.status === 'Ocupada').length;
    const livres = vagas.filter(v => v.status === 'Livre').length;
    const reservadas = vagas.filter(v => v.status === 'Reservada').length;
    const faturamento = historico.reduce((t, i) => t + i.valor, 0);
    return {
      livres,
      ocupadas,
      reservadas,
      faturamento,
      ticketMedio: historico.length ? faturamento / historico.length : 0,
      ocupacao: ativas.length ? Math.round((ocupadas / ativas.length) * 100) : 0,
    };
  }, [vagas, historico]);

  // ── Gerador de código de vaga ─────────────────────────────────────────────

  const gerarCodigoVaga = useCallback((vagasAtuais: ParkingSpot[]): string => {
    // Agrupa por letra e encontra o próximo slot disponível
    const codigosExistentes = new Set(vagasAtuais.map(v => v.codigo.toUpperCase()));
    for (let letraIdx = 0; letraIdx < 26; letraIdx++) {
      const letra = String.fromCharCode(65 + letraIdx);
      for (let num = 1; num <= 99; num++) {
        const codigo = `${letra}${String(num).padStart(2, '0')}`;
        if (!codigosExistentes.has(codigo)) return codigo;
      }
    }
    return `X${Date.now()}`;
  }, []);

  // ── Ações ──────────────────────────────────────────────────────────────────

  const reservar = useCallback(async (dados: NewReservation) => {
    try {
      await api.post('/api/reservas', {
        vagaId: dados.vagaId,
        nomeCliente: dados.cliente,
        telefoneCliente: '',
        placa: dados.placa,
        modeloVeiculo: dados.modelo,
        horarioChegadaPrevisto: new Date(dados.entrada).toISOString(),
        horarioSaidaPrevisto: new Date(dados.saidaPrevista).toISOString(),
      });
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao reservar vaga:', err);
      throw err;
    }
  }, [carregarVagas]);

  const marcarChegada = useCallback(async (vagaId: number) => {
    try {
      const reservaId = vagas.find(v => v.id === vagaId)?.reservaId;
      if (!reservaId) {
        console.error('[ParkingContext] marcarChegada: reservaId não encontrado para vagaId', vagaId);
        return;
      }
      await api.post(`/api/reservas/${reservaId}/checkin`);
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao marcar chegada:', err);
      throw err;
    }
  }, [vagas, carregarVagas]);

  const cancelarReserva = useCallback(async (vagaId: number) => {
    try {
      const reservaId = vagas.find(v => v.id === vagaId)?.reservaId;
      if (!reservaId) {
        console.error('[ParkingContext] cancelarReserva: reservaId não encontrado para vagaId', vagaId);
        return;
      }
      await api.post(`/api/reservas/${reservaId}/cancelar`, { motivo: 'Cancelado pelo operador' });
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao cancelar reserva:', err);
      throw err;
    }
  }, [vagas, carregarVagas]);

  const cancelarReservaExpirada = useCallback(async (vagaId: number) => {
    try {
      const reservaId = vagas.find(v => v.id === vagaId)?.reservaId;
      if (!reservaId) {
        console.error('[ParkingContext] cancelarReservaExpirada: reservaId não encontrado para vagaId', vagaId);
        return;
      }
      await api.post(`/api/reservas/${reservaId}/cancelar`, { motivo: 'Cancelado pelo operador' });
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao cancelar reserva expirada:', err);
      throw err;
    }
  }, [vagas, carregarVagas]);

  const finalizarPagamento = useCallback(async (vagaId: number, pagamento: HistoryItem['pagamento']) => {
    try {
      const reservaId = vagas.find(v => v.id === vagaId)?.reservaId;
      if (!reservaId) {
        console.error('[ParkingContext] finalizarPagamento: reservaId não encontrado para vagaId', vagaId);
        return;
      }
      // 1. Checkout
      await api.post(`/api/reservas/${reservaId}/checkout`);
      // 2. Pagamento
      await api.post('/api/pagamentos', {
        reservaId,
        formaPagamento: mapPagamentoParaApi(pagamento),
        valorRecebido: null,
      });
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao finalizar pagamento:', err);
      throw err;
    }
  }, [vagas, carregarVagas]);

  const adicionarVaga = useCallback(async (tipo: TipoVaga = 'Normal') => {
    try {
      const codigo = gerarCodigoVaga(vagas);
      await api.post('/api/vagas', {
        codigo,
        tipoVaga: mapTipoParaApi(tipo),
        posicaoX: 0,
        posicaoY: 0,
      });
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao adicionar vaga:', err);
      throw err;
    }
  }, [vagas, gerarCodigoVaga, carregarVagas]);

  const editarVaga = useCallback(async (vagaId: number, codigo: string, tipo?: TipoVaga) => {
    try {
      await api.put(`/api/vagas/${vagaId}`, {
        codigo: codigo.toUpperCase(),
        ...(tipo ? { tipoVaga: mapTipoParaApi(tipo) } : {}),
      });
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao editar vaga:', err);
      throw err;
    }
  }, [carregarVagas]);

  const inativarVaga = useCallback(async (vagaId: number) => {
    try {
      await api.patch(`/api/vagas/${vagaId}/inativar`);
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao inativar vaga:', err);
      throw err;
    }
  }, [carregarVagas]);

  const reativarVaga = useCallback(async (vagaId: number) => {
    try {
      await api.patch(`/api/vagas/${vagaId}/reativar`);
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao reativar vaga:', err);
      throw err;
    }
  }, [carregarVagas]);

  const excluirVaga = useCallback(async (vagaId: number) => {
    try {
      await api.delete(`/api/vagas/${vagaId}`);
      await carregarVagas();
    } catch (err) {
      console.error('[ParkingContext] Erro ao excluir vaga:', err);
      throw err;
    }
  }, [carregarVagas]);

  const salvarConfiguracoes = useCallback(async (settings: Settings) => {
    try {
      await api.post('/api/configuracoes/tarifas', {
        valorMinimo: settings.valorHora,
        valorIncremento: settings.valorHora,
        minutosFaixa: 60,
        dataVigencia: new Date().toISOString(),
        status: 'ATIVA',
      });
      setConfiguracoes(settings);
      // Atualiza histórico de tarifas
      try {
        const { data } = await api.get<unknown>('/api/configuracoes/tarifas');
        const lista = Array.isArray(data) ? data : ((data as { tarifas?: unknown[] }).tarifas ?? []);
        const tarifasMapeadas: TarifaItem[] = (lista as Record<string, unknown>[]).map((t) => ({
          id: String(t.id ?? ''),
          valorHora: Number(t.valorIncremento ?? t.valorHora ?? 0),
          toleranciaMinutos: Number(t.toleranciaMinutos ?? 0),
          ativa: String(t.status ?? '').toUpperCase() === 'ATIVA',
          criadoEm: String(t.dataVigencia ?? t.criadoEm ?? new Date().toISOString()),
          criadoPor: String(t.criadoPor ?? usuario?.nome ?? 'Sistema'),
        }));
        setHistoricoTarifas(tarifasMapeadas);
      } catch (errTarifas) {
        console.error('[ParkingContext] Erro ao recarregar histórico de tarifas:', errTarifas);
      }
    } catch (err) {
      console.error('[ParkingContext] Erro ao salvar configurações:', err);
      throw err;
    }
  }, [usuario]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ParkingContext.Provider value={{
      vagas,
      historico,
      auditoria,
      historicoTarifas,
      configuracoes,
      loading,
      metricas,
      reservar,
      marcarChegada,
      cancelarReserva,
      cancelarReservaExpirada,
      finalizarPagamento,
      adicionarVaga,
      editarVaga,
      inativarVaga,
      reativarVaga,
      excluirVaga,
      salvarConfiguracoes,
      calcularValor,
      calcularTempo,
      carregarVagas,
    }}>
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  return useContext(ParkingContext);
}
