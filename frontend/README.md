<div align="center">
  <img src="https://img.shields.io/badge/AUTOSLOT-SISTEMA_DE_ESTACIONAMENTO-blue?style=for-the-badge&logo=react&logoColor=white" alt="Logo Autoslot" />
  <h1>🚗 Autoslot - Gestão Inteligente de Estacionamento</h1>
  <p><i>Substituindo a prancheta por tecnologia de ponta.</i></p>
</div>

---

## 📖 Sobre o Projeto
O **Autoslot** é uma plataforma **interna** desenvolvida para modernizar a gestão de estacionamentos por hora. O projeto substitui controles manuais e organiza o fluxo de **reservas recebidas pelo WhatsApp**, oferecendo:

- **Mapa visual de vagas** (livre / reservada / ocupada / inativa)
- **Ciclo completo**: reserva → check-in → check-out → pagamento → liberação
- **Dashboard em tempo real** com indicadores e alertas (no-show/atrasos)
- **Motor financeiro** com cálculo automático por tempo + tolerância
- **Gestão administrativa** (tarifas, vagas, usuários e permissões)
- **Histórico, relatórios** (faturamento e ocupação) e **auditoria** de ações

Este repositório reúne o projeto acadêmico e a organização do desenvolvimento em **6 Sprints (Duplas)**.

---

## 🎯 Objetivo do Produto
- Reduzir erros de cobrança (cálculo automático e rastreável)
- Evitar overbooking (bloqueio de conflitos e controle de status)
- Acelerar operação no caixa (fluxos em poucos cliques)
- Aumentar controle gerencial (relatórios + auditoria)

---

## 👤 Perfis de Acesso
- **ADMIN (Dono):** configura tarifas, gerencia vagas/usuários, acessa relatórios e auditoria.
- **FUNCIONÁRIO (Operação):** realiza reserva, check-in, check-out e registra pagamentos.

---

## 🧩 Principais Módulos
- **Autenticação & Permissões** (JWT + perfis)
- **Mapa de Vagas** (grid/posição e ações rápidas)
- **Reservas** (criar, listar, buscar, editar e cancelar)
- **Entrada Direta** (sem reserva)
- **Pagamento & Checkout** (cálculo automático + vínculo do operador)
- **Tarifas** (histórico e apenas 1 ativa)
- **Relatórios** (faturamento e ocupação)
- **Auditoria** (log de ações por usuário)

---

## 🛠️ Tecnologias Utilizadas
<div align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" />
</div>

---

## ✅ Funcionalidades (Resumo)
- Login com perfis (ADMIN/FUNCIONÁRIO)
- Mapa de vagas com status e ações por clique
- Criação de reserva com validações e conflito de horários
- Check-in (confirmar chegada) e entrada direta
- Check-out com cálculo automático e tolerância
- Registro de pagamento (dinheiro/pix/cartão) com vínculo ao operador
- Gestão de vagas (Admin): cadastrar, editar, inativar e excluir quando permitido
- Gestão de tarifas (Admin): manter histórico e controlar tarifa ativa
- Dashboard com alertas (no-show/expiração/ocupação crítica)
- Relatórios (Admin): faturamento e ocupação
- Auditoria (Admin): quem fez o quê e quando

---

## 🚀 Estrutura de Desenvolvimento (Sprints)
Clique em cada seção para ver os detalhes técnicos de implementação:

<details>
<summary><b>🔐 Dupla 1: Autenticação e Segurança</b></summary>
<br>

- **Frontend:** Tela de login responsiva (React), rotas públicas/privadas, bloqueio por perfil.
- **Backend:** Autenticação JWT e hash de senhas (ex: bcrypt).
- **Destaque:** Perfis (ADMIN vs FUNCIONÁRIO) e middleware de permissão.
</details>

<details>
<summary><b>🗺️ Dupla 2: Mapa e Estrutura de Vagas</b></summary>
<br>

- **Frontend:** Mapa em grid (posições X/Y), legenda de cores, ações rápidas por status.
- **Backend:** Endpoints para mapa e detalhes da vaga, validações por status.
- **Destaque:** Gestão de vagas (Admin) com **inativação** e exclusão apenas quando permitido.
</details>

<details>
<summary><b>⏱️ Dupla 3: Ciclo de Reserva e Entrada</b></summary>
<br>

- **Frontend:** Nova reserva + listagem/busca + check-in (confirmar chegada) + entrada direta.
- **Backend:** Validação de conflito de horários (RN02), criação/edição/cancelamento de reservas.
- **Destaque:** Alertas de no-show/atraso e regras de status da reserva/vaga.
</details>

<details>
<summary><b>💰 Dupla 4: Motor Financeiro e Checkout</b></summary>
<br>

- **Frontend:** Tela/modal de checkout e pagamento (PIX, Cartão, Dinheiro).
- **Backend:** Cálculo automático por tempo + tolerância, registro de pagamento e liberação de vaga.
- **Destaque:** Bloqueio de saída sem pagamento (RN03).
</details>

<details>
<summary><b>📊 Dupla 5: Gestão e Relatórios (LGPD)</b></summary>
<br>

- **Frontend:** Dashboard com KPIs e alertas; telas de relatórios (Admin).
- **Backend:** Endpoints agregados para faturamento e ocupação; filtros por período.
- **Destaque:** Exibição mínima de dados sensíveis e controle de acesso por perfil.
</details>

<details>
<summary><b>⚙️ Dupla 6: Configurações do Administrador</b></summary>
<br>

- **Frontend:** Painel Admin para tarifas, vagas, usuários e auditoria.
- **Backend:** Persistência de configurações e logs de auditoria.
- **Destaque:** Histórico de tarifas e rastreabilidade por usuário.
</details>

---

## 📋 Regras de Negócio de Destaque
- **RN01 (Integridade):** Vagas com histórico não devem ser removidas; usar inativação.
- **RN02 (Conflito):** Bloquear reservas com sobreposição de horário na mesma vaga.
- **RN03 (Segurança):** Nenhuma vaga é liberada sem pagamento registrado.
- **RN04 (UX):** Erros amigáveis; sem expor detalhes técnicos ao usuário.

---

## 🔒 Privacidade e LGPD (Resumo)
- Sistema de uso interno (sem portal para cliente final).
- Acesso controlado por autenticação e perfis.
- Evitar exibição desnecessária de dados sensíveis (ex: telefone) em telas agregadas.
- Auditoria para rastrear alterações e operações críticas.

---

## ▶️ Como Executar (Visão Geral)
> Ajuste os comandos conforme a estrutura do repositório (ex: `/frontend` e `/backend`).

**1) Pré-requisitos**
- Node.js (LTS recomendado)
- MySQL
- Gerenciador de pacotes (npm ou yarn)

**2) Variáveis de ambiente (exemplo)**
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`
- `PORT`

**3) Execução**
- Subir o banco MySQL
- Rodar migrations/seed (se aplicável)
- Iniciar backend
- Iniciar frontend
- Acessar o sistema via navegador

---

## 👥 Equipe do Projeto
| Nome | Função |
| :--- | :--- |
| **João Miguel** | Analista de Requisitos |
| **Felipe Moreira** | Desenvolvedor Frontend |
| **Felipe Nadab** | Desenvolvedor Frontend |
| **João Pedro** | Desenvolvedor Backend |
| **Kaio Cesar** | Desenvolvedor Backend |
| **Mateus Fonseca** | Analista de QA |

---

<div align="center">
  <p>Projeto acadêmico desenvolvido para a disciplina de Laboratório de Desenvolvimento de Software - UNICV 2026</p>
</div>
