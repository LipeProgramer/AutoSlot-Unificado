using AutoSlot.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditoriaController : ControllerBase
{
    private readonly AuditoriaService _auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService)
    {
        _auditoriaService = auditoriaService;
    }

    // GET api/auditoria
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] DateTime? inicio = null,
        [FromQuery] DateTime? fim = null,
        [FromQuery] int? usuarioId = null,
        [FromQuery] string? acao = null,
        [FromQuery] string? entidade = null,
        [FromQuery] string? entidadeId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var (logs, total) = await _auditoriaService.Listar(
                inicio, fim, usuarioId, acao, entidade, entidadeId, page, pageSize);

            return Ok(new
            {
                logs = logs.Select(l => new
                {
                    id = l.Id,
                    dataHora = l.DataHora,
                    usuario = new
                    {
                        id = l.Usuario.Id,
                        nome = l.Usuario.Nome,
                        login = l.Usuario.Email
                    },
                    acao = l.Acao,
                    entidade = l.Entidade,
                    entidadeId = l.EntidadeId,
                    resumo = l.Resumo
                }),
                pagination = new { page, pageSize, total }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensagem = ex.Message });
        }
    }

    // GET api/auditoria/5
    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        try
        {
            var log = await _auditoriaService.BuscarPorId(id);

            if (log == null)
                return NotFound(new { mensagem = "Log não encontrado." });

            return Ok(new
            {
                log = new
                {
                    id = log.Id,
                    dataHora = log.DataHora,
                    usuario = new
                    {
                        id = log.Usuario.Id,
                        nome = log.Usuario.Nome,
                        login = log.Usuario.Email
                    },
                    acao = log.Acao,
                    entidade = log.Entidade,
                    entidadeId = log.EntidadeId,
                    ip = log.Ip,
                    dadosAntes = log.DadosAntes,
                    dadosDepois = log.DadosDepois,
                    resumo = log.Resumo
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensagem = ex.Message });
        }
    }
}