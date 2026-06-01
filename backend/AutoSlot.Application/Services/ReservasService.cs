using AutoSlot.Domain.Models;
using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AutoSlot.Application.Services;

public class ReservasService
{
    private readonly AppDbContext _context;
    private readonly AuditoriaService _auditoria;

    public ReservasService(AppDbContext context, AuditoriaService auditoria)
    {
        _context = context;
        _auditoria = auditoria;
    }

    public async Task<Reserva> CriarReserva(
        int vagaId, int funcionarioId,
        string nomeCliente, string telefoneCliente,
        string placa, string modeloVeiculo,
        DateTime chegadaPrevista, DateTime saidaPrevista)
    {
        if (saidaPrevista <= chegadaPrevista)
            throw new Exception("O horário de saída deve ser maior que o de chegada.");

        var vaga = await _context.Vagas.FindAsync(vagaId);
        if (vaga == null)
            throw new Exception("Vaga não encontrada.");
        if (vaga.Status == "INATIVA")
            throw new Exception("Não é possível reservar uma vaga inativa.");
        if (vaga.Status == "OCUPADA")
            throw new Exception("A vaga está ocupada.");

        var conflito = await _context.Reservas.AnyAsync(r =>
            r.VagaId == vagaId &&
            (r.Status == "RESERVADA" || r.Status == "OCUPADA") &&
            chegadaPrevista < r.HorarioSaidaPrevisto &&
            saidaPrevista > r.HorarioChegadaPrevisto);

        if (conflito)
            throw new Exception("Conflito de horário: já existe uma reserva nesse período para esta vaga.");

        var reserva = new Reserva
        {
            VagaId = vagaId,
            FuncionarioId = funcionarioId,
            Status = "RESERVADA",
            NomeCliente = nomeCliente,
            TelefoneCliente = telefoneCliente,
            Placa = placa.ToUpper().Replace("-", "").Replace(" ", ""),
            ModeloVeiculo = modeloVeiculo,
            HorarioChegadaPrevisto = chegadaPrevista,
            HorarioSaidaPrevisto = saidaPrevista,
            CriadoEm = DateTime.UtcNow
        };

        vaga.Status = "RESERVADA";
        _context.Reservas.Add(reserva);
        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "CREATE", "RESERVA", reserva.Id.ToString(),
            resumo: $"Reserva criada para placa {reserva.Placa} na vaga {vagaId}");

        return reserva;
    }

    public async Task<(List<Reserva> reservas, int total)> Listar(
        string? status, string? placa, string? nome,
        DateTime? inicio, DateTime? fim,
        int page, int pageSize)
    {
        var query = _context.Reservas
            .Include(r => r.Vaga)
            .Include(r => r.Funcionario)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);
        if (!string.IsNullOrEmpty(placa))
            query = query.Where(r => r.Placa.Contains(placa.ToUpper()));
        if (!string.IsNullOrEmpty(nome))
            query = query.Where(r => r.NomeCliente.ToLower().Contains(nome.ToLower()));
        if (inicio.HasValue)
            query = query.Where(r => r.HorarioChegadaPrevisto >= inicio.Value);
        if (fim.HasValue)
            query = query.Where(r => r.HorarioChegadaPrevisto <= fim.Value);

        var total = await query.CountAsync();
        var reservas = await query
            .OrderByDescending(r => r.CriadoEm)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (reservas, total);
    }

    public async Task<Reserva?> BuscarPorId(int id)
    {
        return await _context.Reservas
            .Include(r => r.Vaga)
            .Include(r => r.Funcionario)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Reserva> Editar(
        int id, int funcionarioId,
        string nomeCliente, string telefoneCliente,
        string modeloVeiculo, DateTime chegadaPrevista,
        DateTime saidaPrevista, int vagaId)
    {
        var reserva = await _context.Reservas
            .Include(r => r.Vaga)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reserva == null)
            throw new Exception("Reserva não encontrada.");
        if (reserva.Status != "RESERVADA")
            throw new Exception("Apenas reservas com status RESERVADA podem ser editadas.");
        if (saidaPrevista <= chegadaPrevista)
            throw new Exception("O horário de saída deve ser maior que o de chegada.");

        var conflito = await _context.Reservas.AnyAsync(r =>
            r.VagaId == vagaId && r.Id != id &&
            (r.Status == "RESERVADA" || r.Status == "OCUPADA") &&
            chegadaPrevista < r.HorarioSaidaPrevisto &&
            saidaPrevista > r.HorarioChegadaPrevisto);

        if (conflito)
            throw new Exception("Conflito de horário ao editar.");

        if (reserva.VagaId != vagaId)
        {
            reserva.Vaga.Status = "LIVRE";
            var novaVaga = await _context.Vagas.FindAsync(vagaId);
            if (novaVaga == null || novaVaga.Status == "INATIVA")
                throw new Exception("Nova vaga não encontrada ou inativa.");
            novaVaga.Status = "RESERVADA";
            reserva.VagaId = vagaId;
        }

        reserva.NomeCliente = nomeCliente;
        reserva.TelefoneCliente = telefoneCliente;
        reserva.ModeloVeiculo = modeloVeiculo;
        reserva.HorarioChegadaPrevisto = chegadaPrevista;
        reserva.HorarioSaidaPrevisto = saidaPrevista;

        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "UPDATE", "RESERVA", reserva.Id.ToString(),
            resumo: $"Reserva {id} editada");

        return reserva;
    }

    public async Task<Reserva> Cancelar(int id, int funcionarioId, string? motivo)
    {
        var reserva = await _context.Reservas
            .Include(r => r.Vaga)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reserva == null)
            throw new Exception("Reserva não encontrada.");
        if (reserva.Status != "RESERVADA")
            throw new Exception("Apenas reservas com status RESERVADA podem ser canceladas.");

        reserva.Status = "CANCELADA";
        reserva.MotivoCancelamento = motivo;
        reserva.Vaga.Status = "LIVRE";

        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "UPDATE", "RESERVA", reserva.Id.ToString(),
            resumo: $"Reserva {id} cancelada. Motivo: {motivo ?? "não informado"}");

        return reserva;
    }

    public async Task<Reserva> CheckIn(int id, int funcionarioId)
    {
        var reserva = await _context.Reservas
            .Include(r => r.Vaga)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (reserva == null)
            throw new Exception("Reserva não encontrada.");
        if (reserva.Status != "RESERVADA")
            throw new Exception("Check-in só é permitido para reservas com status RESERVADA.");
        if (reserva.Vaga.Status == "INATIVA")
            throw new Exception("A vaga está inativa.");

        reserva.Status = "OCUPADA";
        reserva.HorarioChegadaReal = DateTime.UtcNow;
        reserva.Vaga.Status = "OCUPADA";

        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "UPDATE", "RESERVA", reserva.Id.ToString(),
            resumo: $"Check-in realizado na reserva {id}, vaga {reserva.Vaga.Codigo}");

        return reserva;
    }

    public async Task<Reserva> EntradaDireta(
        int vagaId, int funcionarioId,
        string placa, string nomeCliente,
        string telefoneCliente, string modeloVeiculo)
    {
        var vaga = await _context.Vagas.FindAsync(vagaId);
        if (vaga == null)
            throw new Exception("Vaga não encontrada.");
        if (vaga.Status != "LIVRE")
            throw new Exception("A vaga não está livre.");

        var agora = DateTime.UtcNow;
        var reserva = new Reserva
        {
            VagaId = vagaId,
            FuncionarioId = funcionarioId,
            Status = "OCUPADA",
            NomeCliente = nomeCliente,
            TelefoneCliente = telefoneCliente,
            Placa = placa.ToUpper().Replace("-", "").Replace(" ", ""),
            ModeloVeiculo = modeloVeiculo,
            HorarioChegadaPrevisto = agora,
            HorarioSaidaPrevisto = agora.AddHours(2),
            HorarioChegadaReal = agora,
            CriadoEm = agora
        };

        vaga.Status = "OCUPADA";
        _context.Reservas.Add(reserva);
        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "CREATE", "RESERVA", reserva.Id.ToString(),
            resumo: $"Entrada direta para placa {reserva.Placa} na vaga {vaga.Codigo}");

        return reserva;
    }

    public async Task<object> Checkout(int id)
    {
        var reserva = await _context.Reservas
            .Include(r => r.Vaga)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new Exception("Reserva não encontrada.");

        if (reserva.Status != "OCUPADA")
            throw new Exception("Checkout só é permitido para reservas com status OCUPADA.");

        var tarifa = await _context.Tarifas.FirstOrDefaultAsync(t => t.Status == "ATIVA")
            ?? throw new Exception("Nenhuma tarifa ativa encontrada.");

        var saida = DateTime.UtcNow;
        var entrada = reserva.HorarioChegadaReal ?? reserva.HorarioChegadaPrevisto;
        var totalMinutos = (int)(saida - entrada).TotalMinutes;

        var (valorFinal, faixasCobraveis, detalheFaixas) = CalcularCobranca(totalMinutos, tarifa);

        return new
        {
            reservaId = reserva.Id,
            vagaId = reserva.VagaId,
            horarioEntrada = entrada,
            horarioSaida = saida,
            minutosTotal = totalMinutos,
            minutosFaixa = tarifa.MinutosFaixa,
            valorMinimo = tarifa.ValorMinimo,
            valorIncremento = tarifa.ValorIncremento,
            faixasCobraveis,
            detalheFaixas,
            valorFinal,
            tarifaId = tarifa.Id
        };
    }

    public async Task<Pagamento> RegistrarPagamento(
        int reservaId, int funcionarioId,
        string formaPagamento, decimal? valorRecebido)
    {
        var reserva = await _context.Reservas
            .Include(r => r.Vaga)
            .FirstOrDefaultAsync(r => r.Id == reservaId)
            ?? throw new Exception("Reserva não encontrada.");

        if (reserva.Status != "OCUPADA")
            throw new Exception("Pagamento só pode ser registrado para reservas OCUPADAS.");

        var pagamentoExistente = await _context.Pagamentos.AnyAsync(p => p.ReservaId == reservaId);
        if (pagamentoExistente)
            throw new Exception("Pagamento já registrado para esta reserva.");

        var tarifa = await _context.Tarifas.FirstOrDefaultAsync(t => t.Status == "ATIVA")
            ?? throw new Exception("Nenhuma tarifa ativa encontrada.");

        var saida = DateTime.UtcNow;
        var entrada = reserva.HorarioChegadaReal ?? reserva.HorarioChegadaPrevisto;
        var totalMinutos = (int)(saida - entrada).TotalMinutes;

        var (valorFinal, _, _) = CalcularCobranca(totalMinutos, tarifa);

        if (formaPagamento == "DINHEIRO")
        {
            if (valorRecebido == null)
                throw new Exception("Valor recebido é obrigatório para pagamento em dinheiro.");
            if (valorRecebido < valorFinal)
                throw new Exception("Valor recebido é menor que o valor cobrado.");
        }

        decimal? troco = formaPagamento == "DINHEIRO" ? valorRecebido - valorFinal : null;

        reserva.HorarioSaidaReal = saida;
        reserva.Status = "FINALIZADA";
        reserva.Vaga.Status = "LIVRE";

        var pagamento = new Pagamento
        {
            ReservaId = reservaId,
            FuncionarioId = funcionarioId,
            TarifaId = tarifa.Id,
            ValorCobrado = valorFinal,
            FormaPagamento = formaPagamento,
            ValorRecebido = valorRecebido,
            Troco = troco,
            TempoMinutos = totalMinutos,
            RegistradoEm = DateTime.UtcNow
        };

        _context.Pagamentos.Add(pagamento);
        await _context.SaveChangesAsync();

        await _auditoria.Registrar(
            funcionarioId, "CREATE", "PAGAMENTO", pagamento.Id.ToString(),
            resumo: $"Pagamento de R${valorFinal:F2} via {formaPagamento} para reserva {reservaId}");

        await _auditoria.Registrar(
            funcionarioId, "UPDATE", "RESERVA", reservaId.ToString(),
            resumo: $"Reserva {reservaId} finalizada após pagamento");

        return pagamento;
    }

    private (decimal valorFinal, int faixasCobraveis, List<object> detalheFaixas) CalcularCobranca(int totalMinutos, Tarifa tarifa)
    {
        decimal valorFinal = tarifa.ValorMinimo;
        int faixasCobraveis = 1;
        var detalheFaixas = new List<object>
        {
            new { faixa = 1, de = 0, ate = tarifa.MinutosFaixa, valor = tarifa.ValorMinimo }
        };

        if (totalMinutos > tarifa.MinutosFaixa)
        {
            var minutosAdicionais = totalMinutos - tarifa.MinutosFaixa;
            var faixasAdicionais = (int)Math.Ceiling((double)minutosAdicionais / tarifa.MinutosFaixa);

            for (int i = 1; i <= faixasAdicionais; i++)
            {
                var de = tarifa.MinutosFaixa * i;
                var ate = tarifa.MinutosFaixa * (i + 1);
                detalheFaixas.Add(new { faixa = i + 1, de, ate, valor = tarifa.ValorIncremento });
            }

            valorFinal += faixasAdicionais * tarifa.ValorIncremento;
            faixasCobraveis = 1 + faixasAdicionais;
        }

        return (valorFinal, faixasCobraveis, detalheFaixas);
    }
}