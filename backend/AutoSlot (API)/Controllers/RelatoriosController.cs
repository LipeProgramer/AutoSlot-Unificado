using AutoSlot.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RelatoriosController : ControllerBase
{
    private readonly RelatoriosService _relatoriosService;

    public RelatoriosController(RelatoriosService relatoriosService)
    {
        _relatoriosService = relatoriosService;
    }

    private int GetFuncionarioId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out int id))
            throw new Exception("Funcionário não identificado no token.");
        return id;
    }

    // GET api/relatorios/faturamento?inicio=2026-01-01&fim=2026-12-31
    [HttpGet("faturamento")]
    public async Task<IActionResult> Faturamento(
        [FromQuery] DateTime inicio,
        [FromQuery] DateTime fim,
        [FromQuery] string? formaPagamento = null,
        [FromQuery] int? operadorId = null)
    {
        if (fim < inicio)
            return BadRequest(new { mensagem = "A data fim deve ser maior que a data início." });

        try
        {
            bool isAdmin = User.IsInRole("Admin");
            int? opId = isAdmin ? operadorId : GetFuncionarioId();

            var resultado = await _relatoriosService.ObterFaturamento(
                inicio, fim, formaPagamento, opId);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensagem = ex.Message });
        }
    }

    // GET api/relatorios/ocupacao?inicio=2026-01-01&fim=2026-12-31
    [HttpGet("ocupacao")]
    public async Task<IActionResult> Ocupacao(
        [FromQuery] DateTime inicio,
        [FromQuery] DateTime fim)
    {
        if (fim < inicio)
            return BadRequest(new { mensagem = "A data fim deve ser maior que a data início." });

        try
        {
            var resultado = await _relatoriosService.ObterOcupacao(inicio, fim);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensagem = ex.Message });
        }
    }
}