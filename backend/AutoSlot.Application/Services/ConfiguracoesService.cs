using AutoSlot.Domain.Models;
using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoSlot.Application.Services;

public class ConfiguracoesService
{
    private readonly AppDbContext _context;
    private readonly AuditoriaService _auditoria;

    public ConfiguracoesService(AppDbContext context, AuditoriaService auditoria)
    {
        _context = context;
        _auditoria = auditoria;
    }

    public async Task<Tarifa?> ObterTarifaAtiva(string? tipoVaga = null)
    {
        // First try to find a specific tariff for this vaga type
        if (!string.IsNullOrEmpty(tipoVaga))
        {
            var especifica = await _context.Tarifas
                .FirstOrDefaultAsync(t => t.Status == "ATIVA" && t.TipoVaga == tipoVaga);
            if (especifica != null) return especifica;
        }
        // Fallback to generic tariff
        return await _context.Tarifas.FirstOrDefaultAsync(t => t.Status == "ATIVA" && t.TipoVaga == null);
    }

    public async Task<List<Tarifa>> ListarTarifas(string? status = null)
    {
        var query = _context.Tarifas.AsQueryable();
        if (!string.IsNullOrEmpty(status))
            query = query.Where(t => t.Status == status);
        return await query.OrderByDescending(t => t.CriadoEm).ToListAsync();
    }

    public async Task<Tarifa> CriarTarifa(int funcionarioId, decimal valorMinimo, decimal valorIncremento, int minutosFaixa, DateTime dataVigencia, string status, string? tipoVaga = null)
    {
        if (valorMinimo <= 0)
            throw new ArgumentException("O valor mínimo deve ser maior que zero.");
        if (valorIncremento <= 0)
            throw new ArgumentException("O valor de incremento deve ser maior que zero.");
        if (minutosFaixa <= 0)
            throw new ArgumentException("Os minutos por faixa devem ser maiores que zero.");

        // Only inactivate the matching type tariff
        if (status == "ATIVA")
            await InativarTarifaAtual(tipoVaga);

        var tarifa = new Tarifa
        {
            ValorMinimo = valorMinimo,
            ValorIncremento = valorIncremento,
            MinutosFaixa = minutosFaixa,
            DataVigencia = dataVigencia,
            Status = status,
            TipoVaga = tipoVaga,
            CriadoEm = DateTime.UtcNow
        };

        _context.Tarifas.Add(tarifa);
        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "CREATE", "TARIFA", tarifa.Id.ToString(),
            resumo: $"Tarifa criada: mínimo R${valorMinimo}, incremento R${valorIncremento}, faixa {minutosFaixa}min, status {status}, tipo {tipoVaga ?? "padrão"}");

        return tarifa;
    }

    public async Task<Tarifa> AtivarTarifa(int id, int funcionarioId)
    {
        var tarifa = await _context.Tarifas.FindAsync(id);
        if (tarifa == null)
            throw new Exception("Tarifa não encontrada.");

        await InativarTarifaAtual();
        tarifa.Status = "ATIVA";
        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "UPDATE", "TARIFA", tarifa.Id.ToString(),
            resumo: $"Tarifa {id} ativada");

        return tarifa;
    }

    public async Task<Tarifa> InativarTarifa(int id, int funcionarioId)
    {
        var tarifa = await _context.Tarifas.FindAsync(id);
        if (tarifa == null)
            throw new Exception("Tarifa não encontrada.");

        var totalAtivas = await _context.Tarifas.CountAsync(t => t.Status == "ATIVA");
        if (tarifa.Status == "ATIVA" && totalAtivas <= 1)
            throw new Exception("Não é possível inativar a única tarifa ativa do sistema.");

        tarifa.Status = "INATIVA";
        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "UPDATE", "TARIFA", tarifa.Id.ToString(),
            resumo: $"Tarifa {id} inativada");

        return tarifa;
    }

    private async Task InativarTarifaAtual(string? tipoVaga = null)
    {
        // Inactivate only the tariff matching the same TipoVaga scope
        var tarifaAtiva = await _context.Tarifas
            .FirstOrDefaultAsync(t => t.Status == "ATIVA" && t.TipoVaga == tipoVaga);
        if (tarifaAtiva != null)
        {
            tarifaAtiva.Status = "INATIVA";
            await _context.SaveChangesAsync();
        }
    }
}