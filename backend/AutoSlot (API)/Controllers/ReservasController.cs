using AutoSlot.Application.Services;
using AutoSlot.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AutoSlot.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReservasController : ControllerBase
{
    private readonly ReservasService _reservasService;

    public ReservasController(ReservasService reservasService)
    {
        _reservasService = reservasService;
    }

    [HttpPost]
    public async Task<IActionResult> CriarReserva([FromBody] CriarReservaDTO dto)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var reserva = await _reservasService.CriarReserva(
                dto.VagaId, funcionarioId,
                dto.NomeCliente, dto.TelefoneCliente,
                dto.Placa, dto.ModeloVeiculo,
                dto.HorarioChegadaPrevisto, dto.HorarioSaidaPrevisto);

            return StatusCode(201, new
            {
                reserva = new
                {
                    id = reserva.Id,
                    status = reserva.Status,
                    nomeCliente = reserva.NomeCliente,
                    placa = reserva.Placa,
                    vagaId = reserva.VagaId,
                    horarioChegadaPrevisto = reserva.HorarioChegadaPrevisto,
                    horarioSaidaPrevisto = reserva.HorarioSaidaPrevisto,
                    usuarioCriacaoId = reserva.FuncionarioId
                }
            });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? status = null,
        [FromQuery] string? placa = null,
        [FromQuery] string? nome = null,
        [FromQuery] DateTime? inicio = null,
        [FromQuery] DateTime? fim = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (reservas, total) = await _reservasService.Listar(status, placa, nome, inicio, fim, page, pageSize);
        return Ok(new
        {
            reservas = reservas.Select(r => new
            {
                id = r.Id,
                status = r.Status,
                placa = r.Placa,
                nomeCliente = r.NomeCliente,
                modeloVeiculo = r.ModeloVeiculo,
                vagaId = r.VagaId,
                vagaIdentificacao = r.Vaga?.Codigo,
                horarioChegadaPrevisto = r.HorarioChegadaPrevisto,
                horarioSaidaPrevisto = r.HorarioSaidaPrevisto,
                horarioChegadaReal = r.HorarioChegadaReal,
                horarioSaidaReal = r.HorarioSaidaReal
            }),
            pagination = new { page, pageSize, total }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        var reserva = await _reservasService.BuscarPorId(id);
        if (reserva == null)
            return NotFound(new { mensagem = "Reserva não encontrada." });

        return Ok(new
        {
            reserva = new
            {
                id = reserva.Id,
                status = reserva.Status,
                nomeCliente = reserva.NomeCliente,
                telefoneCliente = reserva.TelefoneCliente,
                placa = reserva.Placa,
                modeloVeiculo = reserva.ModeloVeiculo,
                vagaId = reserva.VagaId,
                vagaIdentificacao = reserva.Vaga?.Codigo,
                horarioChegadaPrevisto = reserva.HorarioChegadaPrevisto,
                horarioSaidaPrevisto = reserva.HorarioSaidaPrevisto,
                horarioChegadaReal = reserva.HorarioChegadaReal,
                horarioSaidaReal = reserva.HorarioSaidaReal,
                usuarioCriacaoId = reserva.FuncionarioId
            }
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Editar(int id, [FromBody] EditarReservaDTO dto)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var reserva = await _reservasService.Editar(
                id, funcionarioId,
                dto.NomeCliente, dto.TelefoneCliente,
                dto.ModeloVeiculo, dto.HorarioChegadaPrevisto,
                dto.HorarioSaidaPrevisto, dto.VagaId);
            return Ok(new { mensagem = "Reserva atualizada com sucesso!", reserva });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPost("{id}/cancelar")]
    public async Task<IActionResult> Cancelar(int id, [FromBody] CancelarReservaDTO dto)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var reserva = await _reservasService.Cancelar(id, funcionarioId, dto.Motivo);
            return Ok(new { mensagem = "Reserva cancelada com sucesso!", reserva });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPost("{id}/checkin")]
    public async Task<IActionResult> CheckIn(int id)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var reserva = await _reservasService.CheckIn(id, funcionarioId);
            return Ok(new
            {
                reserva = new
                {
                    id = reserva.Id,
                    status = reserva.Status,
                    horarioChegadaReal = reserva.HorarioChegadaReal,
                    vagaId = reserva.VagaId
                }
            });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPost("entrada-direta")]
    public async Task<IActionResult> EntradaDireta([FromBody] EntradaDiretaDTO dto)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var reserva = await _reservasService.EntradaDireta(
                dto.VagaId, funcionarioId,
                dto.Placa, dto.NomeCliente,
                dto.TelefoneCliente, dto.ModeloVeiculo);

            return StatusCode(201, new
            {
                reserva = new
                {
                    id = reserva.Id,
                    status = reserva.Status,
                    placa = reserva.Placa,
                    horarioChegadaReal = reserva.HorarioChegadaReal,
                    vagaId = reserva.VagaId,
                    usuarioCriacaoId = reserva.FuncionarioId
                }
            });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPost("{id}/checkout")]
    public async Task<IActionResult> Checkout(int id)
    {
        try
        {
            var checkout = await _reservasService.Checkout(id);
            return Ok(new { checkout });
        }
        catch (Exception ex) { return BadRequest(new { mensagem = ex.Message }); }
    }

    [HttpPost("/api/pagamentos")]
    public async Task<IActionResult> RegistrarPagamento([FromBody] PagamentoDTO dto)
    {
        try
        {
            var funcionarioId = ObterFuncionarioId();
            var pagamento = await _reservasService.RegistrarPagamento(
                dto.ReservaId, funcionarioId,
                dto.FormaPagamento, dto.ValorRecebido);

            return StatusCode(201, new
            {
                pagamento = new
                {
                    id = pagamento.Id,
                    reservaId = pagamento.ReservaId,
                    valorCobrado = pagamento.ValorCobrado,
                    formaPagamento = pagamento.FormaPagamento,
                    valorRecebido = pagamento.ValorRecebido,
                    troco = pagamento.Troco,
                    tarifaId = pagamento.TarifaId,
                    usuarioRegistroId = pagamento.FuncionarioId,
                    createdAt = pagamento.RegistradoEm
                }
            });
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