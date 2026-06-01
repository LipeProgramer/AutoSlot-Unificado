namespace AutoSlot.DTOs;

public class TarifaDTO
{
    public decimal ValorMinimo { get; set; }
    public decimal ValorIncremento { get; set; }
    public int MinutosFaixa { get; set; }
    public DateTime DataVigencia { get; set; }
    public string Status { get; set; } = "INATIVA";
}