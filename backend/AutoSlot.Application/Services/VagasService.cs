using AutoSlot.Domain.Models;
using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoSlot.Application.Services;

public class VagasService
{
    private readonly AppDbContext _context;
    private readonly AuditoriaService _auditoriaService;

    public VagasService(AppDbContext context, AuditoriaService auditoriaService)
    {
        _context = context;
        _auditoriaService = auditoriaService;
    }

    public async Task<List<Vaga>> ListarTodas(string? status = null)
    {
        var query = _context.Vagas.AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(v => v.Status == status);
        else
            query = query.Where(v => v.Status != "INATIVA");

        return await query.ToListAsync();
    }

    public async Task<Vaga?> BuscarPorId(int id)
    {
        return await _context.Vagas.FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<List<Vaga>> ListarMapa()
    {
        return await _context.Vagas.ToListAsync();
    }

    public async Task<Vaga> Criar(string codigo, string tipoVaga, int posicaoX, int posicaoY, int usuarioId)
    {
        var existe = await _context.Vagas.AnyAsync(v => v.Codigo == codigo);
        if (existe)
            throw new Exception($"Já existe uma vaga com o código '{codigo}'.");

        var vaga = new Vaga
        {
            Codigo = codigo,
            TipoVaga = tipoVaga,
            Status = "LIVRE",
            PosicaoX = posicaoX,
            PosicaoY = posicaoY
        };

        _context.Vagas.Add(vaga);
        await _context.SaveChangesAsync();

        await _auditoriaService.Registrar(
            usuarioId, "CREATE", "VAGA",
            vaga.Id.ToString(),
            $"Vaga '{codigo}' criada");

        return vaga;
    }

    public async Task<Vaga> Editar(int id, string codigo, string tipoVaga, int posicaoX, int posicaoY, int usuarioId = 0)
    {
        var vaga = await _context.Vagas.FindAsync(id);
        if (vaga == null)
            throw new Exception("Vaga não encontrada.");

        if (vaga.Status == "OCUPADA" || vaga.Status == "RESERVADA")
            throw new Exception("Não é possível editar uma vaga que está ocupada ou reservada.");

        var codigoEmUso = await _context.Vagas.AnyAsync(v => v.Codigo == codigo && v.Id != id);
        if (codigoEmUso)
            throw new Exception($"Já existe uma vaga com o código '{codigo}'.");

        var dadosAntes = $"codigo={vaga.Codigo}, tipo={vaga.TipoVaga}";

        vaga.Codigo = codigo;
        vaga.TipoVaga = tipoVaga;
        vaga.PosicaoX = posicaoX;
        vaga.PosicaoY = posicaoY;

        await _context.SaveChangesAsync();

        if (usuarioId > 0)
            await _auditoriaService.Registrar(
                usuarioId, "UPDATE", "VAGA",
                vaga.Id.ToString(),
                $"Vaga '{codigo}' editada",
                dadosAntes,
                $"codigo={codigo}, tipo={tipoVaga}");

        return vaga;
    }

    public async Task Inativar(int id, int usuarioId = 0)
    {
        var vaga = await _context.Vagas.FindAsync(id);
        if (vaga == null)
            throw new Exception("Vaga não encontrada.");

        if (vaga.Status == "OCUPADA" || vaga.Status == "RESERVADA")
            throw new Exception("Não é possível inativar uma vaga que está ocupada ou reservada.");

        vaga.Status = "INATIVA";
        await _context.SaveChangesAsync();

        if (usuarioId > 0)
            await _auditoriaService.Registrar(
                usuarioId, "UPDATE", "VAGA",
                vaga.Id.ToString(),
                $"Vaga '{vaga.Codigo}' inativada");
    }

    public async Task Reativar(int id, int usuarioId = 0)
    {
        var vaga = await _context.Vagas.FindAsync(id);
        if (vaga == null)
            throw new Exception("Vaga não encontrada.");

        if (vaga.Status != "INATIVA")
            throw new Exception("Vaga não está inativa.");

        vaga.Status = "LIVRE";
        await _context.SaveChangesAsync();

        if (usuarioId > 0)
            await _auditoriaService.Registrar(
                usuarioId, "UPDATE", "VAGA",
                vaga.Id.ToString(),
                $"Vaga '{vaga.Codigo}' reativada");
    }

    public async Task Excluir(int id, int usuarioId = 0)
    {
        var vaga = await _context.Vagas.FindAsync(id);
        if (vaga == null)
            throw new Exception("Vaga não encontrada.");

        if (vaga.Status == "OCUPADA" || vaga.Status == "RESERVADA")
            throw new Exception("Não é possível excluir uma vaga ocupada ou reservada.");

        var temHistorico = await _context.Reservas.AnyAsync(r => r.VagaId == id);
        if (temHistorico)
            throw new Exception("Esta vaga possui histórico de reservas e não pode ser excluída. Use a inativação.");

        if (usuarioId > 0)
            await _auditoriaService.Registrar(
                usuarioId, "DELETE", "VAGA",
                vaga.Id.ToString(),
                $"Vaga '{vaga.Codigo}' excluída");

        _context.Vagas.Remove(vaga);
        await _context.SaveChangesAsync();
    }
}