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

        var listaPagamentos = pagamentos.Select(p => new
        {
            id = p.Id,
            dataHora = p.RegistradoEm,
            placa = p.Reserva.Placa,
            vagaIdentificacao = p.Reserva.Vaga.Codigo,
            valorCobrado = p.ValorCobrado,
            formaPagamento = p.FormaPagamento,
            operadorNome = p.Funcionario.Nome
        }).ToList();

        return new
        {
            resumo = new
            {
                faturamentoTotal,
                pagamentosTotal,
                porFormaPagamento,
                porOperador
            },
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