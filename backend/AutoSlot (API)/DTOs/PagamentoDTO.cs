namespace AutoSlot.DTOs;

public class PagamentoDTO
{
    public int ReservaId { get; set; }
    public string FormaPagamento { get; set; } = string.Empty; // DINHEIRO, PIX, CARTAO
    public decimal? ValorRecebido { get; set; }
}