namespace AutoSlot.DTOs;
public class CriarFuncionarioDTO
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string NivelAcesso { get; set; } = "Funcionario";
}
