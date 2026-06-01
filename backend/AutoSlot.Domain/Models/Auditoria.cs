namespace AutoSlot.Domain.Models;

public class Auditoria
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public Funcionario Usuario { get; set; } = null!;
    public string Acao { get; set; } = string.Empty;       // CREATE, UPDATE, DELETE
    public string Entidade { get; set; } = string.Empty;   // VAGA, RESERVA, PAGAMENTO, TARIFA, USUARIO, CONFIG
    public string EntidadeId { get; set; } = string.Empty;
    public string? DadosAntes { get; set; }
    public string? DadosDepois { get; set; }
    public string? Resumo { get; set; }
    public string? Ip { get; set; }
    public DateTime DataHora { get; set; } = DateTime.UtcNow;
}