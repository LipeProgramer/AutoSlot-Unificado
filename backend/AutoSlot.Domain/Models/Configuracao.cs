namespace AutoSlot.Domain.Models;

public class Configuracao
{
    public int Id { get; set; }
    public decimal TarifaPorHora { get; set; }
    public int MinutosTolerancia { get; set; } = 10;
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow; // ← mudou
}