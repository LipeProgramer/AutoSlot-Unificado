<div align="center">

# 🚗 AutoSlot
### Sistema Inteligente de Gestão de Estacionamento

*Substituindo a prancheta por tecnologia de ponta.*

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![.NET](https://img.shields.io/badge/.NET_8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Figma](https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white)

</div>

---

## Sobre o Projeto

O **AutoSlot** é uma plataforma interna desenvolvida para modernizar a gestão de estacionamentos por hora, substituindo controles manuais e organizando o fluxo de **reservas recebidas pelo WhatsApp**.

O sistema cobre o ciclo completo de operação: da reserva ao checkout com pagamento, passando por check-in, entrada direta e cancelamento — tudo com mapa visual de vagas em tempo real.

---

## Funcionalidades Principais

|            Módulo            | Descrição |
|------------------------------|-----------|
| 🔐 **Autenticação**          | Login com perfis ADMIN e FUNCIONÁRIO, rotas protegidas por |ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ | JWT
| 🗺️ **Mapa de Vagas**         | Grid visual com status em tempo real (livre / reservada / ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ | ocupada / inativa)
| 📅 **Reservas**              | Criar, editar, cancelar e buscar — com validação de conflito de horários |
| 🚪 **Entrada & Check-in**    | Confirmar chegada de reservas ou registrar entrada direta |
| 💰 **Checkout & Pagamento**  | Cálculo automático por tempo + tolerância; PIX, cartão e dinheiro |
| ⚙️ **Configurações (Admin)** | Gestão de vagas, tarifas (com histórico) e usuários |
| 📊 **Relatórios (Admin)**    | Faturamento e ocupação com filtros por período |
| 🔍 **Auditoria (Admin)**     | Log completo de ações por usuário |

---

## Perfis de Acesso

- **ADMIN (Dono):** configura tarifas, gerencia vagas e usuários, acessa relatórios e auditoria.
- **FUNCIONÁRIO (Operação):** realiza reservas, check-ins, checkouts e registra pagamentos.

---

## Regras de Negócio

|   Regra  |                            Descrição                              |
|----------|-------------------------------------------------------------------|
| **RN01** | Vagas com histórico não são excluídas — apenas inativadas         |
| **RN02** | Reservas com sobreposição de horário na mesma vaga são bloqueadas |
| **RN03** | Nenhuma vaga é liberada sem pagamento registrado                  |
| **RN04** | Erros exibidos de forma amigável, sem expor detalhes técnicos     |

---

## Como Executar

> **Pré-requisitos:** VS Code · PostgreSQL 18 (pgAdmin) · .NET 8 SDK · Node.js

### 1. Abrir o projeto

No VS Code: `File → Open Folder` → selecione a pasta **AutoSlot-Unificado**

### 2. Iniciar o PostgreSQL

Abra o **pgAdmin** — basta mantê-lo aberto para o serviço ficar ativo.

### 3. Rodar o Backend

```powershell
cd backend
dotnet run --project "AutoSlot (API)\AutoSlot (API).csproj"
```

Aguarde: `Now listening on: http://localhost:5000`

> Swagger disponível em: http://localhost:5000/swagger

### 4. Rodar o Frontend

```powershell
cd frontend
npm install
npm run dev
```

Aguarde: `Local: http://localhost:5173/`

### 5. Acessar o sistema

Abra **http://localhost:5173** e entre com uma das credenciais abaixo:

|    Perfil   |           E-mail           |    Senha   |
|-------------|----------------------------|------------|
| Admin       | `admin@autoSlot.com`       | `Admin123!`|
| Funcionário | `funcionario@autoSlot.com` | `Func123!` |

> ⚠️ **Ordem de inicialização:** PostgreSQL → Backend → Frontend

---

## Estrutura de Sprints

<details>
<summary><b>🔐 Dupla 1 — Autenticação e Segurança</b></summary>

- **Frontend:** Tela de login responsiva, rotas públicas/privadas, bloqueio por perfil
- **Backend:** Autenticação JWT, hash de senhas com bcrypt
- **Destaque:** Middleware de permissão por perfil (ADMIN vs FUNCIONÁRIO)
</details>

<details>
<summary><b>🗺️ Dupla 2 — Mapa e Estrutura de Vagas</b></summary>

- **Frontend:** Grid com posições X/Y, legenda de cores, ações rápidas por status
- **Backend:** Endpoints de mapa e detalhes de vaga, validações de status
- **Destaque:** Inativação de vagas com histórico; exclusão apenas quando permitido
</details>

<details>
<summary><b>⏱️ Dupla 3 — Ciclo de Reserva e Entrada</b></summary>

- **Frontend:** Nova reserva, listagem/busca, check-in e entrada direta
- **Backend:** Validação de conflito de horários (RN02), CRUD de reservas
- **Destaque:** Alertas de no-show/atraso e controle de status de vaga
</details>

<details>
<summary><b>💰 Dupla 4 — Motor Financeiro e Checkout</b></summary>

- **Frontend:** Modal de checkout com seleção de forma de pagamento
- **Backend:** Cálculo automático por tempo + tolerância, registro e liberação de vaga
- **Destaque:** Bloqueio de saída sem pagamento (RN03)
</details>

<details>
<summary><b>📊 Dupla 5 — Relatórios e Dashboard</b></summary>

- **Frontend:** Dashboard com KPIs e alertas; telas de relatórios para Admin
- **Backend:** Endpoints agregados de faturamento e ocupação com filtros por período
- **Destaque:** Exibição mínima de dados sensíveis (LGPD)
</details>

<details>
<summary><b>⚙️ Dupla 6 — Configurações do Administrador</b></summary>

- **Frontend:** Painel de tarifas, vagas, usuários e auditoria
- **Backend:** Persistência de configurações e logs de auditoria
- **Destaque:** Histórico de tarifas com apenas uma ativa por vez; rastreabilidade por usuário
</details>

---

## Equipe

|      Nome      |         Função         |
|----------------|------------------------|
| João Miguel    | Analista de Requisitos |
| Felipe Moreira | Desenvolvedor Frontend |
| Felipe Nadab   | Desenvolvedor Frontend |
| João Pedro     | Desenvolvedor Backend  |
| Kaio Cesar     | Desenvolvedor Backend  |
| Mateus Fonseca | Analista de QA         |

---

<div align="center">
  <sub>Projeto acadêmico — Laboratório de Desenvolvimento de Software · UNICV 2026</sub>
</div>
