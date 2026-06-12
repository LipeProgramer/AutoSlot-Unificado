using AutoSlot.Application.Services;
using AutoSlot.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var jwtKey = builder.Configuration["Jwt:Key"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = false
        };

        // Normaliza o claim de role ao validar o token.
        // O banco pode ter gravado "ADMIN", "admin", "Admin" etc.
        // [Authorize(Roles = "Admin")] é case-sensitive, então padronizamos aqui.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = ctx =>
            {
                var identity = ctx.Principal?.Identity as System.Security.Claims.ClaimsIdentity;
                if (identity != null)
                {
                    var roleClaim = identity.FindFirst(System.Security.Claims.ClaimTypes.Role);
                    if (roleClaim != null)
                    {
                        var normalizada = roleClaim.Value.Trim().ToUpper() == "ADMIN"
                            ? "Admin"
                            : "Funcionario";
                        identity.RemoveClaim(roleClaim);
                        identity.AddClaim(new System.Security.Claims.Claim(
                            System.Security.Claims.ClaimTypes.Role, normalizada));
                    }
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "http://localhost:3000",
            "https://auto-slot-unificado.vercel.app"
        )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddAuthorization();
builder.Services.AddMemoryCache();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Digite: Bearer {seu token}"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<VagasService>();
builder.Services.AddScoped<ReservasService>();
builder.Services.AddScoped<ConfiguracoesService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<RelatoriosService>();
builder.Services.AddScoped<AuditoriaService>();
builder.Services.AddScoped<FuncionariosService>();
builder.Services.AddHostedService<ReservaExpiracaoService>();

var app = builder.Build();

// Migra e Semeia o Banco de Dados automaticamente
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();

        bool modificou = false;

        if (!context.Funcionarios.Any(f => f.Email == "admin@autoSlot.com"))
        {
            context.Funcionarios.Add(new AutoSlot.Domain.Models.Funcionario
            {
                Nome = "Administrador",
                Email = "admin@autoSlot.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                NivelAcesso = "Admin",
                Ativo = true,
                CriadoEm = DateTime.UtcNow
            });
            modificou = true;
        }

        if (!context.Funcionarios.Any(f => f.Email == "funcionario@autoSlot.com"))
        {
            context.Funcionarios.Add(new AutoSlot.Domain.Models.Funcionario
            {
                Nome = "Funcionário",
                Email = "funcionario@autoSlot.com",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword("Func123!"),
                NivelAcesso = "Funcionario",
                Ativo = true,
                CriadoEm = DateTime.UtcNow
            });
            modificou = true;
        }
        
        // Também semeamos uma tarifa inicial ativa para evitar erros de reserva
        if (!context.Tarifas.Any())
        {
            context.Tarifas.Add(new AutoSlot.Domain.Models.Tarifa
            {
                ValorMinimo = 5.00m,
                ValorIncremento = 2.00m,
                MinutosFaixa = 60,
                DataVigencia = DateTime.UtcNow,
                Status = "ATIVA",
                CriadoEm = DateTime.UtcNow
            });
            modificou = true;
        }

        // Semeamos algumas vagas iniciais para o mapa do estacionamento
        if (!context.Vagas.Any())
        {
            for (int i = 1; i <= 10; i++)
            {
                context.Vagas.Add(new AutoSlot.Domain.Models.Vaga
                {
                    Codigo = $"A{i:00}",
                    TipoVaga = "COMUM",
                    Status = "LIVRE",
                    PosicaoX = (i - 1) % 5,
                    PosicaoY = (i - 1) / 5
                });
            }
            modificou = true;
        }

        if (modificou)
        {
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ocorreu um erro ao inicializar o banco de dados.");
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();