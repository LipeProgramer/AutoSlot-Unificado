namespace AutoSlot.DTOs;

public class CriarReservaDTO
{
    public string NomeCliente { get; set; } = string.Empty;
    public string TelefoneCliente { get; set; } = string.Empty;
    public string Placa { get; set; } = string.Empty;
    public string ModeloVeiculo { get; set; } = string.Empty;
    public DateTime HorarioChegadaPrevisto { get; set; }
    public DateTime HorarioSaidaPrevisto { get; set; }
    public int VagaId { get; set; }
}