namespace AutoSlot.Domain.Models;

public class Tarifa
{
    public int Id { get; set; }
    public decimal ValorMinimo { get; set; }       // Valor cobrado na primeira faixa
    public decimal ValorIncremento { get; set; }   // Valor cobrado por faixa adicional
    public int MinutosFaixa { get; set; }          // Duração de cada faixa em minutos
    public DateTime DataVigencia { get; set; }
    public string Status { get; set; } = "INATIVA";
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}