using AutoSlot.Domain.Models;
using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoSlot.Application.Services;

public class AuditoriaService
{
    private readonly AppDbContext _context;

    public AuditoriaService(AppDbContext context)
    {
        _context = context;
    }

    // Registrar uma ação no log
    public async Task Registrar(
        int usuarioId,
        string acao,
        string entidade,
        string entidadeId,
        string? resumo = null,
        string? dadosAntes = null,
        string? dadosDepois = null,
        string? ip = null)
    {
        var log = new Auditoria
        {
            UsuarioId = usuarioId,
            Acao = acao,
            Entidade = entidade,
            EntidadeId = entidadeId,
            Resumo = resumo,
            DadosAntes = dadosAntes,
            DadosDepois = dadosDepois,
            Ip = ip,
            DataHora = DateTime.UtcNow
        };

        _context.Auditorias.Add(log);
        await _context.SaveChangesAsync();
    }

    // Listar logs com filtros e paginação
    public async Task<(List<Auditoria> logs, int total)> Listar(
        DateTime? inicio,
        DateTime? fim,
        int? usuarioId,
        string? acao,
        string? entidade,
        string? entidadeId,
        int page,
        int pageSize)
    {
        var query = _context.Auditorias
            .Include(a => a.Usuario)
            .AsQueryable();

        if (inicio.HasValue)
            query = query.Where(a => a.DataHora >= inicio.Value);

        if (fim.HasValue)
            query = query.Where(a => a.DataHora <= fim.Value.AddDays(1));

        if (usuarioId.HasValue)
            query = query.Where(a => a.UsuarioId == usuarioId.Value);

        if (!string.IsNullOrEmpty(acao))
            query = query.Where(a => a.Acao == acao);

        if (!string.IsNullOrEmpty(entidade))
            query = query.Where(a => a.Entidade == entidade);

        if (!string.IsNullOrEmpty(entidadeId))
            query = query.Where(a => a.EntidadeId == entidadeId);

        var total = await query.CountAsync();

        var logs = await query
            .OrderByDescending(a => a.DataHora)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (logs, total);
    }

    // Buscar log por ID
    public async Task<Auditoria?> BuscarPorId(int id)
    {
        return await _context.Auditorias
            .Include(a => a.Usuario)
            .FirstOrDefaultAsync(a => a.Id == id);
    }
}