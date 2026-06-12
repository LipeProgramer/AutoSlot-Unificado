using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoSlot.Application.Services;

public class RelatoriosService
{
    private readonly AppDbContext _context;

    public RelatoriosService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<object> ObterFaturamento(
        DateTime inicio, DateTime fim,
        string? formaPagamento = null,
        int? operadorId = null)
    {
        var fimDia = fim.AddDays(1);

        var query = _context.Pagamentos
            .Include(p => p.Reserva)
                .ThenInclude(r => r.Vaga)
            .Include(p => p.Funcionario)
            .Where(p => p.RegistradoEm >= inicio && p.RegistradoEm < fimDia)
            .AsQueryable();

        if (!string.IsNullOrEmpty(formaPagamento))
            query = query.Where(p => p.FormaPagamento == formaPagamento);

        if (operadorId.HasValue)
            query = query.Where(p => p.FuncionarioId == operadorId.Value);

        var pagamentos = await query.ToListAsync();

        var faturamentoTotal = pagamentos.Sum(p => p.ValorCobrado);
        var pagamentosTotal = pagamentos.Count;

        var porFormaPagamento = new
        {
            DINHEIRO = pagamentos.Where(p => p.FormaPagamento == "DINHEIRO").Sum(p => p.ValorCobrado),
            PIX = pagamentos.Where(p => p.FormaPagamento == "PIX").Sum(p => p.ValorCobrado),
            CARTAO = pagamentos.Where(p => p.FormaPagamento == "CARTAO").Sum(p => p.ValorCobrado)
        };

        var porOperador = pagamentos
            .GroupBy(p => new { p.FuncionarioId, p.Funcionario.Nome })
            .Select(g => new
            {
                operadorId = g.Key.FuncionarioId,
                nome = g.Key.Nome,
                total = g.Sum(p => p.ValorCobrado)
            }).ToList();

        var ticketMedio = pagamentosTotal > 0 ? Math.Round(faturamentoTotal / pagamentosTotal, 2) : 0;

        var listaPagamentos = pagamentos.Select(p => {
            var tipoVaga = p.Reserva.Vaga?.TipoVaga;
            bool temDesconto = tipoVaga != null &&
                (tipoVaga.Equals("PCD", StringComparison.OrdinalIgnoreCase) ||
                 tipoVaga.Equals("Idoso", StringComparison.OrdinalIgnoreCase));
            
            decimal valorBruto = p.ValorCobrado;
            decimal valorDesconto = 0;
            if (temDesconto) {
                valorBruto = p.ValorCobrado * 2m;
                valorDesconto = valorBruto - p.ValorCobrado;
            }

            return new
            {
                id = p.Id,
                reservaId = p.ReservaId,
                valorCobrado = p.ValorCobrado,
                formaPagamento = p.FormaPagamento,
                registradoEm = p.RegistradoEm,
                cliente = string.IsNullOrEmpty(p.Reserva.NomeCliente) ? "Cliente não identificado" : p.Reserva.NomeCliente,
                placa = p.Reserva.Placa,
                entrada = p.Reserva.HorarioChegadaReal ?? p.Reserva.HorarioChegadaPrevisto,
                saida = p.Reserva.HorarioSaidaReal ?? p.Reserva.HorarioSaidaPrevisto,
                tempoMinutos = p.TempoMinutos,
                valorBruto = valorBruto,
                descontoDetalhe = temDesconto ? $"{tipoVaga} (50%)" : null,
                descontoValor = valorDesconto,
                status = "Pago"
            };
        }).ToList();

        return new
        {
            total = faturamentoTotal,
            ticketMedio = ticketMedio,
            totalAtendimentos = pagamentosTotal,
            porFormaPagamento,
            pagamentos = listaPagamentos
        };
    }

    public async Task<object> ObterOcupacao(DateTime inicio, DateTime fim)
    {
        var fimDia = fim.AddDays(1);

        // Reservas finalizadas no período
        var reservas = await _context.Reservas
            .Include(r => r.Vaga)
            .Where(r =>
                r.HorarioChegadaReal >= inicio &&
                r.HorarioChegadaReal < fimDia &&
                (r.Status == "FINALIZADA" || r.Status == "OCUPADA"))
            .ToListAsync();

        var checkinsTotal = reservas.Count;

        // Ranking de vagas por uso
        var rankingVagas = reservas
            .GroupBy(r => r.Vaga.Codigo)
            .Select(g => new
            {
                vagaIdentificacao = g.Key,
                totalUsos = g.Count()
            })
            .OrderByDescending(v => v.totalUsos)
            .ToList();

        var vagaMaisUsada = rankingVagas.FirstOrDefault();
        var vagaMenosUsada = rankingVagas.LastOrDefault();

        // Taxa média de ocupação
        var totalVagasAtivas = await _context.Vagas.CountAsync(v => v.Status != "INATIVA");
        var diasPeriodo = Math.Max(1, (fim - inicio).Days + 1);
        var taxaMediaOcupacao = totalVagasAtivas > 0
            ? Math.Round((double)checkinsTotal / (totalVagasAtivas * diasPeriodo) * 100, 1)
            : 0;

        return new
        {
            resumo = new
            {
                taxaMediaOcupacao,
                checkinsTotal,
                vagaMaisUsada = vagaMaisUsada != null ? new
                {
                    vagaIdentificacao = vagaMaisUsada.vagaIdentificacao,
                    total = vagaMaisUsada.totalUsos
                } : null,
                vagaMenosUsada = vagaMenosUsada != null ? new
                {
                    vagaIdentificacao = vagaMenosUsada.vagaIdentificacao,
                    total = vagaMenosUsada.totalUsos
                } : null
            },
            rankingVagas
        };
    }
}