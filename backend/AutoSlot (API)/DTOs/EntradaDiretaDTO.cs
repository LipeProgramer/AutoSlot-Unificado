namespace AutoSlot.DTOs;

public class EntradaDiretaDTO
{
    public string Placa { get; set; } = string.Empty;
    public string NomeCliente { get; set; } = string.Empty;
    public string TelefoneCliente { get; set; } = string.Empty;
    public string ModeloVeiculo { get; set; } = string.Empty;
    public int VagaId { get; set; }
}