using AutoSlot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AutoSlot.Application.Services;

public class ReservaExpiracaoService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ReservaExpiracaoService> _logger;
    private const int ToleranciaMinutos = 15;
    private const int IntervaloChecagemMinutos = 10;

    public ReservaExpiracaoService(IServiceScopeFactory scopeFactory, ILogger<ReservaExpiracaoService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[ExpiracaoService] Serviço iniciado. Checagem a cada {min} minutos.", IntervaloChecagemMinutos);
        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromMinutes(IntervaloChecagemMinutos), stoppingToken);
            try { await ExpirarReservas(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "[ExpiracaoService] Erro ao expirar reservas."); }
        }
    }

    private async Task ExpirarReservas(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var limite = DateTime.UtcNow.AddMinutes(-ToleranciaMinutos);
        var expiradas = await context.Reservas
            .Where(r => r.Status == "RESERVADA" && r.HorarioChegadaPrevisto < limite)
            .ToListAsync(ct);

        if (!expiradas.Any()) return;

        foreach (var r in expiradas)
        {
            r.Status = "EXPIRADA";
            // Libera a vaga
            var vaga = await context.Vagas.FindAsync(new object[] { r.VagaId }, ct);
            if (vaga != null && vaga.Status == "RESERVADA")
                vaga.Status = "LIVRE";
        }

        await context.SaveChangesAsync(ct);
        _logger.LogInformation("[ExpiracaoService] {count} reserva(s) expirada(s).", expiradas.Count);
    }
}
