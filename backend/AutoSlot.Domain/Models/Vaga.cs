namespace AutoSlot.Domain.Models;

public class Vaga
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string TipoVaga { get; set; } = "COMUM";
    public string Status { get; set; } = "LIVRE"; // LIVRE, RESERVADA, OCUPADA, INATIVA
    public int PosicaoX { get; set; } = 0;
    public int PosicaoY { get; set; } = 0;
}