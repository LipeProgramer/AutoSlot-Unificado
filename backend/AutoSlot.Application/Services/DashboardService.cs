using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoSlot.Application.Services;

public class DashboardService
{
    private readonly AppDbContext _context;

    public DashboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<object> ObterResumo()
    {
        var hoje = DateTime.UtcNow.Date;
        var amanha = hoje.AddDays(1);

        // Vagas
        var todasVagas = await _context.Vagas.ToListAsync();
        var totalVagas = todasVagas.Count;
        var vagasAtivas = todasVagas.Count(v => v.Status != "INATIVA");
        var vagasLivres = todasVagas.Count(v => v.Status == "LIVRE");
        var vagasReservadas = todasVagas.Count(v => v.Status == "RESERVADA");
        var vagasOcupadas = todasVagas.Count(v => v.Status == "OCUPADA");
        var vagasInativas = todasVagas.Count(v => v.Status == "INATIVA");
        var percentualOcupacao = vagasAtivas > 0
            ? Math.Round((double)(vagasOcupadas + vagasReservadas) / vagasAtivas * 100, 1)
            : 0;

        // Reservas do dia
        var reservasHoje = await _context.Reservas
            .Where(r => r.CriadoEm >= hoje && r.CriadoEm < amanha)
            .ToListAsync();

        var totalReservasHoje = reservasHoje.Count;
        var reservasAtivas = await _context.Reservas
            .CountAsync(r => r.Status == "RESERVADA" || r.Status == "OCUPADA");
        var reservasExpiradas = reservasHoje.Count(r => r.Status == "EXPIRADA");
        var reservasCanceladas = reservasHoje.Count(r => r.Status == "CANCELADA");

        // Financeiro do dia
        var pagamentosHoje = await _context.Pagamentos
            .Where(p => p.RegistradoEm >= hoje && p.RegistradoEm < amanha)
            .ToListAsync();

        var faturamentoHoje = pagamentosHoje.Sum(p => p.ValorCobrado);
        var totalPagamentosHoje = pagamentosHoje.Count;
        var porFormaPagamento = new
        {
            DINHEIRO = pagamentosHoje.Where(p => p.FormaPagamento == "DINHEIRO").Sum(p => p.ValorCobrado),
            PIX = pagamentosHoje.Where(p => p.FormaPagamento == "PIX").Sum(p => p.ValorCobrado),
            CARTAO = pagamentosHoje.Where(p => p.FormaPagamento == "CARTAO").Sum(p => p.ValorCobrado)
        };

        return new
        {
            vagas = new
            {
                total = totalVagas,
                ativas = vagasAtivas,
                livres = vagasLivres,
                reservadas = vagasReservadas,
                ocupadas = vagasOcupadas,
                inativas = vagasInativas,
                percentualOcupacao
            },
            reservas = new
            {
                totalHoje = totalReservasHoje,
                ativas = reservasAtivas,
                expiradasHoje = reservasExpiradas,
                canceladasHoje = reservasCanceladas
            },
            financeiro = new
            {
                faturamentoHoje,
                pagamentosHoje = totalPagamentosHoje,
                porFormaPagamento
            }
        };
    }

    public async Task<object> ObterAlertas()
    {
        var agora = DateTime.UtcNow;

        // Buscar configurações de tempo
        var tarifa = await _context.Tarifas
            .FirstOrDefaultAsync(t => t.Status == "ATIVA");

        int tempoNoShow = 30;      // minutos padrão para no-show
        int tempoExpiracao = 60;   // minutos padrão para expiração
        int tempoAvisoExpiracao = 10; // minutos antes de expirar para avisar

        // Reservas RESERVADAS (aguardando check-in)
        var reservasAguardando = await _context.Reservas
            .Include(r => r.Vaga)
            .Where(r => r.Status == "RESERVADA")
            .ToListAsync();

        // No-show: passou do horário previsto + tolerância
        var noShow = reservasAguardando
            .Where(r => agora > r.HorarioChegadaPrevisto.AddMinutes(tempoNoShow))
            .Select(r => new
            {
                reservaId = r.Id,
                vaga = r.Vaga.Codigo,
                placa = r.Placa,
                nomeCliente = r.NomeCliente,
                minutosAtraso = (int)(agora - r.HorarioChegadaPrevisto).TotalMinutes,
                horarioChegadaPrevisto = r.HorarioChegadaPrevisto
            }).ToList();

        // Próximas de expirar: vai expirar nos próximos X minutos
        var proximasDeExpirar = reservasAguardando
            .Where(r =>
            {
                var minutosParaExpirar = (r.HorarioChegadaPrevisto.AddMinutes(tempoExpiracao) - agora).TotalMinutes;
                return minutosParaExpirar > 0 && minutosParaExpirar <= tempoAvisoExpiracao;
            })
            .Select(r => new
            {
                reservaId = r.Id,
                vaga = r.Vaga.Codigo,
                placa = r.Placa,
                minutosParaExpirar = (int)(r.HorarioChegadaPrevisto.AddMinutes(tempoExpiracao) - agora).TotalMinutes,
                horarioChegadaPrevisto = r.HorarioChegadaPrevisto
            }).ToList();

        // Ocupação crítica: menos de 20% de vagas livres
        var totalAtivas = await _context.Vagas.CountAsync(v => v.Status != "INATIVA");
        var totalLivres = await _context.Vagas.CountAsync(v => v.Status == "LIVRE");
        var limiteOcupacaoCritica = (int)(totalAtivas * 0.2); // 20% do total
        var ocupacaoCritica = new
        {
            ativo = totalLivres <= limiteOcupacaoCritica,
            vagasLivres = totalLivres,
            limite = limiteOcupacaoCritica
        };

        return new
        {
            noShow,
            proximasDeExpirar,
            ocupacaoCritica
        };
    }
}