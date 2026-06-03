using AutoSlot.Application.Services;
using AutoSlot.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/funcionarios")]
[Authorize]
public class FuncionariosController : ControllerBase
{
    private readonly FuncionariosService _service;
    public FuncionariosController(FuncionariosService service) => _service = service;

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    private bool IsAdmin() => User.IsInRole("Admin");

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        if (!IsAdmin()) return Forbid();
        var lista = await _service.ListarTodos();
        return Ok(lista.Select(f => new {
            f.Id, f.Nome, f.Email, f.NivelAcesso, f.Ativo,
            criadoEm = f.CriadoEm
        }));
    }

    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarFuncionarioDTO dto)
    {
        if (!IsAdmin()) return Forbid();
        try
        {
            var f = await _service.Criar(dto.Nome, dto.Email, dto.Senha, dto.NivelAcesso, GetUserId());
            return Ok(new { mensagem = "Funcionário criado com sucesso!", id = f.Id, f.Nome, f.NivelAcesso });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(int id, [FromBody] EditarFuncionarioDTO dto)
    {
        if (!IsAdmin()) return Forbid();
        try
        {
            var f = await _service.Editar(id, dto.Nome, dto.Email, dto.NivelAcesso, GetUserId());
            return Ok(new { mensagem = "Funcionário editado com sucesso!", f.Id, f.Nome });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPatch("{id}/toggle-ativo")]
    public async Task<IActionResult> ToggleAtivo(int id)
    {
        if (!IsAdmin()) return Forbid();
        try
        {
            var f = await _service.ToggleAtivo(id, GetUserId());
            return Ok(new { mensagem = f.Ativo ? "Funcionário reativado." : "Funcionário desativado.", f.Ativo });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }
}
