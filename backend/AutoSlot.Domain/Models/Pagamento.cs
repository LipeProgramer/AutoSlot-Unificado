namespace AutoSlot.Domain.Models;

public class Pagamento
{
    public int Id { get; set; }
    public int ReservaId { get; set; }
    public Reserva Reserva { get; set; } = null!;
    public int FuncionarioId { get; set; }
    public Funcionario Funcionario { get; set; } = null!;
    public int TarifaId { get; set; }
    public Tarifa Tarifa { get; set; } = null!;
    public decimal ValorCobrado { get; set; }
    public string FormaPagamento { get; set; } = string.Empty; // DINHEIRO, PIX, CARTAO
    public decimal? ValorRecebido { get; set; }
    public decimal? Troco { get; set; }
    public int TempoMinutos { get; set; }
    public DateTime RegistradoEm { get; set; } = DateTime.UtcNow;
}