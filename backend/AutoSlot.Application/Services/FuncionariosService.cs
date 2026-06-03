using AutoSlot.Domain.Models;
using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoSlot.Application.Services;

public class FuncionariosService
{
    private readonly AppDbContext _context;
    private readonly AuditoriaService _auditoria;

    public FuncionariosService(AppDbContext context, AuditoriaService auditoria)
    {
        _context = context;
        _auditoria = auditoria;
    }

    public async Task<List<Funcionario>> ListarTodos()
        => await _context.Funcionarios.OrderBy(f => f.Nome).ToListAsync();

    public async Task<Funcionario> Criar(string nome, string email, string senha, string nivelAcesso, int adminId)
    {
        if (await _context.Funcionarios.AnyAsync(f => f.Email == email))
            throw new Exception("Email já cadastrado.");
        if (senha.Length < 6)
            throw new Exception("A senha deve ter no mínimo 6 caracteres.");

        var f = new Funcionario
        {
            Nome = nome,
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha),
            NivelAcesso = nivelAcesso,
            Ativo = true,
            CriadoEm = DateTime.UtcNow
        };
        _context.Funcionarios.Add(f);
        await _context.SaveChangesAsync();
        await _auditoria.Registrar(adminId, "CREATE", "FUNCIONARIO", f.Id.ToString(), $"Funcionário '{nome}' ({nivelAcesso}) criado");
        return f;
    }

    public async Task<Funcionario> Editar(int id, string nome, string email, string nivelAcesso, int adminId)
    {
        var f = await _context.Funcionarios.FindAsync(id)
            ?? throw new Exception("Funcionário não encontrado.");
        if (await _context.Funcionarios.AnyAsync(x => x.Email == email && x.Id != id))
            throw new Exception("Email já cadastrado por outro funcionário.");

        var antes = $"nome={f.Nome}, email={f.Email}, nivel={f.NivelAcesso}";
        f.Nome = nome;
        f.Email = email;
        f.NivelAcesso = nivelAcesso;
        await _context.SaveChangesAsync();
        await _auditoria.Registrar(adminId, "UPDATE", "FUNCIONARIO", id.ToString(), $"Funcionário '{nome}' editado", antes, $"nome={nome}, email={email}, nivel={nivelAcesso}");
        return f;
    }

    public async Task<Funcionario> ToggleAtivo(int id, int adminId)
    {
        var f = await _context.Funcionarios.FindAsync(id)
            ?? throw new Exception("Funcionário não encontrado.");
        if (f.Id == adminId)
            throw new Exception("Você não pode desativar sua própria conta.");

        f.Ativo = !f.Ativo;
        await _context.SaveChangesAsync();
        await _auditoria.Registrar(adminId, "UPDATE", "FUNCIONARIO", id.ToString(), f.Ativo ? $"Funcionário '{f.Nome}' reativado" : $"Funcionário '{f.Nome}' desativado");
        return f;
    }
}
