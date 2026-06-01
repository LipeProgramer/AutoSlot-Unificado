namespace AutoSlot.Domain.Models;

public class Reserva
{
    public int Id { get; set; }
    public int VagaId { get; set; }
    public Vaga Vaga { get; set; } = null!;
    public int FuncionarioId { get; set; }
    public Funcionario Funcionario { get; set; } = null!;
    public string Status { get; set; } = "RESERVADA"; // RESERVADA, OCUPADA, FINALIZADA, CANCELADA, EXPIRADA
    public string NomeCliente { get; set; } = string.Empty;
    public string TelefoneCliente { get; set; } = string.Empty;
    public string Placa { get; set; } = string.Empty;
    public string ModeloVeiculo { get; set; } = string.Empty;
    public DateTime HorarioChegadaPrevisto { get; set; }
    public DateTime HorarioSaidaPrevisto { get; set; }
    public DateTime? HorarioChegadaReal { get; set; }
    public DateTime? HorarioSaidaReal { get; set; }
    public string? MotivoCancelamento { get; set; }
    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}