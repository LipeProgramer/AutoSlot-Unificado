using AutoSlot.Application.Services;
using AutoSlot.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] RegistrarDTO dto)
    {
        try
        {
            var funcionario = await _authService.Registrar(dto.Nome, dto.Email, dto.Senha, dto.NivelAcesso);
            return Ok(new { mensagem = "Funcionário cadastrado com sucesso!", id = funcionario.Id, nome = funcionario.Nome, nivelAcesso = funcionario.NivelAcesso });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDTO dto)
    {
        var token = await _authService.Login(dto.Email, dto.Senha);
        if (token == null) return Unauthorized(new { mensagem = "Email ou senha inválidos." });
        return Ok(new { token });
    }
}