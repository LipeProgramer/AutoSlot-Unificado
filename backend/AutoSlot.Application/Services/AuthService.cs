using AutoSlot.Domain.Models;
using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AutoSlot.Application.Services;

public class AuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    // Rate limiting: email → (tentativas, bloqueadoAte)
    private static readonly Dictionary<string, (int tentativas, DateTime bloqueadoAte)> _tentativas = new();

    private const int MaxTentativas = 5;
    private const int BloqueioMinutos = 15;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<Funcionario> Registrar(string nome, string email, string senha, string nivelAcesso)
    {
        var existe = await _context.Funcionarios.AnyAsync(f => f.Email == email);

        if (existe)
            throw new Exception("Email já cadastrado.");

        var funcionario = new Funcionario
        {
            Nome = nome,
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha),
            NivelAcesso = nivelAcesso,
            Ativo = true,
            CriadoEm = DateTime.UtcNow
        };

        _context.Funcionarios.Add(funcionario);

        try { await _context.SaveChangesAsync(); }
        catch (Exception ex) { throw new Exception(ex.InnerException?.Message ?? ex.Message); }

        return funcionario;
    }

    public async Task<string?> Login(string email, string senha)
    {
        // Check rate limiting
        if (_tentativas.TryGetValue(email, out var entrada))
        {
            if (entrada.tentativas >= MaxTentativas && DateTime.UtcNow < entrada.bloqueadoAte)
                return "BLOQUEADO";

            // Bloqueio expirado — limpa o registro
            if (DateTime.UtcNow >= entrada.bloqueadoAte)
                _tentativas.Remove(email);
        }

        var funcionario = await _context.Funcionarios
            .FirstOrDefaultAsync(f => f.Email == email && f.Ativo);

        if (funcionario == null)
        {
            IncrementarTentativas(email);
            return null;
        }

        if (!BCrypt.Net.BCrypt.Verify(senha, funcionario.SenhaHash))
        {
            IncrementarTentativas(email);
            return null;
        }

        // Login bem-sucedido — remove o contador de falhas
        _tentativas.Remove(email);

        return GerarToken(funcionario);
    }

    public async Task AlterarSenha(int funcionarioId, string senhaAtual, string novaSenha)
    {
        var funcionario = await _context.Funcionarios.FindAsync(funcionarioId);
        if (funcionario == null) throw new Exception("Funcionário não encontrado.");
        if (!BCrypt.Net.BCrypt.Verify(senhaAtual, funcionario.SenhaHash))
            throw new Exception("Senha atual incorreta.");
        if (novaSenha.Length < 6)
            throw new Exception("A nova senha deve ter no mínimo 6 caracteres.");
        funcionario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);
        await _context.SaveChangesAsync();
    }

    private void IncrementarTentativas(string email)
    {
        if (_tentativas.TryGetValue(email, out var atual))
        {
            var novasTentativas = atual.tentativas + 1;
            var bloqueadoAte = novasTentativas >= MaxTentativas
                ? DateTime.UtcNow.AddMinutes(BloqueioMinutos)
                : atual.bloqueadoAte;
            _tentativas[email] = (novasTentativas, bloqueadoAte);
        }
        else
        {
            _tentativas[email] = (1, DateTime.MinValue);
        }
    }

    private string GerarToken(Funcionario funcionario)
    {
        var jwtKey = _configuration["Jwt:Key"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Normaliza a role para o formato exato que [Authorize(Roles = "Admin")] usa.
        // O banco pode guardar "ADMIN", "admin" etc — padronizamos aqui.
        var role = funcionario.NivelAcesso?.Trim().ToUpper() == "ADMIN" ? "Admin" : "Funcionario";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, funcionario.Id.ToString()),
            new Claim(ClaimTypes.Email, funcionario.Email),
            new Claim(ClaimTypes.Name, funcionario.Nome),
            new Claim(ClaimTypes.Role, role)
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}