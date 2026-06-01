using AutoSlot.Application.Services;
using AutoSlot.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VagasController : ControllerBase
{
    private readonly VagasService _vagasService;

    public VagasController(VagasService vagasService)
    {
        _vagasService = vagasService;
    }

    [HttpGet]
    public async Task<IActionResult> ListarTodas([FromQuery] string? status = null)
    {
        var vagas = await _vagasService.ListarTodas(status);
        return Ok(new { vagas });
    }

    [HttpGet("mapa")]
    public async Task<IActionResult> Mapa()
    {
        var vagas = await _vagasService.ListarMapa();
        return Ok(new { vagas });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        var vaga = await _vagasService.BuscarPorId(id);
        if (vaga == null)
            return NotFound(new { mensagem = "Vaga não encontrada." });
        return Ok(vaga);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Criar([FromBody] VagaDTO dto)
    {
        try
        {
            var usuarioId = ObterFuncionarioId();
            var vaga = await _vagasService.Criar(
                dto.Codigo, dto.TipoVaga, dto.PosicaoX, dto.PosicaoY, usuarioId);
            return StatusCode(201, new { mensagem = "Vaga criada com sucesso!", vaga });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Editar(int id, [FromBody] VagaDTO dto)
    {
        try
        {
            var usuarioId = ObterFuncionarioId();
            var vaga = await _vagasService.Editar(
                id, dto.Codigo, dto.TipoVaga, dto.PosicaoX, dto.PosicaoY, usuarioId);
            return Ok(new { mensagem = "Vaga atualizada com sucesso!", vaga });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPatch("{id}/inativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Inativar(int id)
    {
        try
        {
            var usuarioId = ObterFuncionarioId();
            await _vagasService.Inativar(id, usuarioId);
            return Ok(new { mensagem = "Vaga inativada com sucesso!" });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPatch("{id}/reativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reativar(int id)
    {
        try
        {
            var usuarioId = ObterFuncionarioId();
            await _vagasService.Reativar(id, usuarioId);
            return Ok(new { mensagem = "Vaga reativada com sucesso!" });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Excluir(int id)
    {
        try
        {
            var usuarioId = ObterFuncionarioId();
            await _vagasService.Excluir(id, usuarioId);
            return Ok(new { mensagem = "Vaga excluída com sucesso!" });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    private int ObterFuncionarioId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out int id))
            throw new Exception("Funcionário não identificado no token.");
        return id;
    }
}