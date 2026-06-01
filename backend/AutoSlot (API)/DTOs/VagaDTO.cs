namespace AutoSlot.DTOs;

public class VagaDTO
{
    public string Codigo { get; set; } = string.Empty;
    public string TipoVaga { get; set; } = "COMUM";
    public int PosicaoX { get; set; } = 0;
    public int PosicaoY { get; set; } = 0;
}