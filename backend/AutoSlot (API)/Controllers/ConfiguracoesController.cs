using AutoSlot.Application.Services;
using AutoSlot.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfiguracoesController : ControllerBase
{
    private readonly ConfiguracoesService _configuracoesService;

    public ConfiguracoesController(ConfiguracoesService configuracoesService)
    {
        _configuracoesService = configuracoesService;
    }

    [HttpGet("tarifa-ativa")]
    public async Task<IActionResult> ObterTarifaAtiva()
    {
        var tarifa = await _configuracoesService.ObterTarifaAtiva();
        if (tarifa == null)
            return NotFound(new { mensagem = "Nenhuma tarifa ativa encontrada." });
        return Ok(tarifa);
    }

    [HttpGet("tarifas")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ListarTarifas([FromQuery] string? status = null)
    {
        var tarifas = await _configuracoesService.ListarTarifas(status);
        return Ok(new { tarifas });
    }

    [HttpPost("tarifas")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CriarTarifa([FromBody] TarifaDTO dto)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var tarifa = await _configuracoesService.CriarTarifa(
                funcionarioId,
                dto.ValorMinimo,
                dto.ValorIncremento,
                dto.MinutosFaixa,
                dto.DataVigencia,
                dto.Status);
            return StatusCode(201, new { mensagem = "Tarifa criada com sucesso!", tarifa });
        }
        catch (ArgumentException ex) { return BadRequest(new { mensagem = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { mensagem = ex.Message }); }
    }

    [HttpPatch("tarifas/{id}/ativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AtivarTarifa(int id)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var tarifa = await _configuracoesService.AtivarTarifa(id, funcionarioId);
            return Ok(new { mensagem = "Tarifa ativada com sucesso!", tarifa });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPatch("tarifas/{id}/inativar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> InativarTarifa(int id)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var tarifa = await _configuracoesService.InativarTarifa(id, funcionarioId);
            return Ok(new { mensagem = "Tarifa inativada com sucesso!", tarifa });
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