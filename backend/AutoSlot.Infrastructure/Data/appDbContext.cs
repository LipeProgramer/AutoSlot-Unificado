using Microsoft.EntityFrameworkCore;
using AutoSlot.Domain.Models;

namespace AutoSlot.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Funcionario> Funcionarios { get; set; }
    public DbSet<Vaga> Vagas { get; set; }
    public DbSet<Reserva> Reservas { get; set; }
    public DbSet<Pagamento> Pagamentos { get; set; }
    public DbSet<Tarifa> Tarifas { get; set; }
    public DbSet<Auditoria> Auditorias { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Funcionario>().ToTable("funcionarios");
        modelBuilder.Entity<Vaga>().ToTable("vagas");
        modelBuilder.Entity<Reserva>().ToTable("reservas");
        modelBuilder.Entity<Pagamento>().ToTable("pagamentos");
        modelBuilder.Entity<Tarifa>().ToTable("tarifas");
        modelBuilder.Entity<Auditoria>().ToTable("auditoria");

        modelBuilder.Entity<Funcionario>(e =>
        {
            e.Property(f => f.Id).HasColumnName("id");
            e.Property(f => f.Nome).HasColumnName("nome");
            e.Property(f => f.Email).HasColumnName("email");
            e.Property(f => f.SenhaHash).HasColumnName("senha_hash");
            e.Property(f => f.NivelAcesso).HasColumnName("nivel_acesso");
            e.Property(f => f.Ativo).HasColumnName("ativo");
            e.Property(f => f.CriadoEm).HasColumnName("criado_em")
                .HasColumnType("timestamp");
        });

        modelBuilder.Entity<Vaga>(e =>
        {
            e.Property(v => v.Id).HasColumnName("id");
            e.Property(v => v.Codigo).HasColumnName("codigo");
            e.Property(v => v.TipoVaga).HasColumnName("tipo_vaga");
            e.Property(v => v.Status).HasColumnName("status");
            e.Property(v => v.PosicaoX).HasColumnName("posicao_x");
            e.Property(v => v.PosicaoY).HasColumnName("posicao_y");
        });

        modelBuilder.Entity<Tarifa>(e =>
        {
            e.Property(t => t.Id).HasColumnName("id");
            e.Property(t => t.ValorMinimo).HasColumnName("valor_minimo");
            e.Property(t => t.ValorIncremento).HasColumnName("valor_incremento");
            e.Property(t => t.MinutosFaixa).HasColumnName("minutos_faixa");
            e.Property(t => t.DataVigencia).HasColumnName("data_vigencia");
            e.Property(t => t.Status).HasColumnName("status");
            e.Property(t => t.CriadoEm).HasColumnName("criado_em").HasColumnType("timestamp");
        });

        modelBuilder.Entity<Reserva>(e =>
        {
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.VagaId).HasColumnName("vaga_id");
            e.Property(r => r.FuncionarioId).HasColumnName("funcionario_id");
            e.Property(r => r.Status).HasColumnName("status");
            e.Property(r => r.NomeCliente).HasColumnName("nome_cliente");
            e.Property(r => r.TelefoneCliente).HasColumnName("telefone_cliente");
            e.Property(r => r.Placa).HasColumnName("placa");
            e.Property(r => r.ModeloVeiculo).HasColumnName("modelo_veiculo");
            e.Property(r => r.HorarioChegadaPrevisto).HasColumnName("horario_chegada_previsto")
                .HasColumnType("timestamp");
            e.Property(r => r.HorarioSaidaPrevisto).HasColumnName("horario_saida_previsto")
                .HasColumnType("timestamp");
            e.Property(r => r.HorarioChegadaReal).HasColumnName("horario_chegada_real")
                .HasColumnType("timestamp");
            e.Property(r => r.HorarioSaidaReal).HasColumnName("horario_saida_real")
                .HasColumnType("timestamp");
            e.Property(r => r.MotivoCancelamento).HasColumnName("motivo_cancelamento");
            e.Property(r => r.CriadoEm).HasColumnName("criado_em")
                .HasColumnType("timestamp");
        });

        modelBuilder.Entity<Pagamento>(e =>
        {
            e.Property(p => p.Id).HasColumnName("id");
            e.Property(p => p.ReservaId).HasColumnName("reserva_id");
            e.Property(p => p.FuncionarioId).HasColumnName("funcionario_id");
            e.Property(p => p.TarifaId).HasColumnName("tarifa_id");
            e.Property(p => p.ValorCobrado).HasColumnName("valor_cobrado");
            e.Property(p => p.FormaPagamento).HasColumnName("forma_pagamento");
            e.Property(p => p.ValorRecebido).HasColumnName("valor_recebido");
            e.Property(p => p.Troco).HasColumnName("troco");
            e.Property(p => p.TempoMinutos).HasColumnName("tempo_minutos");
            e.Property(p => p.RegistradoEm).HasColumnName("registrado_em")
                .HasColumnType("timestamp");
        });

        modelBuilder.Entity<Auditoria>(e =>
        {
            e.Property(a => a.Id).HasColumnName("id");
            e.Property(a => a.UsuarioId).HasColumnName("usuario_id");
            e.Property(a => a.Acao).HasColumnName("acao");
            e.Property(a => a.Entidade).HasColumnName("entidade");
            e.Property(a => a.EntidadeId).HasColumnName("entidade_id");
            e.Property(a => a.DadosAntes).HasColumnName("dados_antes");
            e.Property(a => a.DadosDepois).HasColumnName("dados_depois");
            e.Property(a => a.Resumo).HasColumnName("resumo");
            e.Property(a => a.Ip).HasColumnName("ip");
            e.Property(a => a.DataHora).HasColumnName("data_hora")
                .HasColumnType("timestamp");
        });
    }
}