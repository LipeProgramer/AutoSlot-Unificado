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
        var funcionario = await _context.Funcionarios
            .FirstOrDefaultAsync(f => f.Email == email && f.Ativo);

        if (funcionario == null) return null;

        if (!BCrypt.Net.BCrypt.Verify(senha, funcionario.SenhaHash)) return null;

        return GerarToken(funcionario);
    }

    private string GerarToken(Funcionario funcionario)
    {
        var jwtKey = _configuration["Jwt:Key"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, funcionario.Id.ToString()),
            new Claim(ClaimTypes.Email, funcionario.Email),
            new Claim(ClaimTypes.Name, funcionario.Nome),
            new Claim(ClaimTypes.Role, funcionario.NivelAcesso)
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