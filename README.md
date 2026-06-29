# Painel @EDI — e.Sales

Painel web para gerenciamento dos testes de protocolos EDI. Substitui a planilha Excel por uma interface moderna com banco MySQL.

## Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui (Radix UI) + Recharts + Lucide Icons
- **Banco**: MySQL 8 via `mysql2/promise` (pool de conexões)
- **Tema**: Dark/Light mode (next-themes)

## Rodando o projeto

```bash
npm install
cp .env.example .env   # configure suas credenciais MySQL
npm run dev            # → http://localhost:3000
```

As tabelas novas (`regras_em_execucao`, `historico_regras`, `casos_teste`) são criadas automaticamente via `CREATE TABLE IF NOT EXISTS` na primeira chamada de API.

## Variáveis de Ambiente

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=testes_esales
ADMIN_DELETE_PASSWORD=senha_para_exclusao
```

## Tabelas do Banco

### Tabelas existentes (pré-existentes)

| Tabela | Descrição |
|--------|-----------|
| `testes_windows` | Regras testadas no Windows |
| `testes_linux` | Regras testadas no Linux |
| `listas` | Valores de dropdowns (executores, protocolos, versões, etc.) |
| `engine` | Dados de engine |
| `regras_reprovadas` | Regras com issue |

### Views existentes

| View | Descrição |
|------|-----------|
| `vw_dashboard` | KPIs agregados (total, aprovados, reprovados, etc.) |
| `vw_resumo_status` | Contagem por status |
| `vw_resumo_por_so` | Comparativo Windows vs Linux |
| `vw_regras_reprovadas` | Regras reprovadas com criticidade |
| `vw_testes` | View unificada de todos os testes |

### Novas tabelas (criadas automaticamente)

#### `regras_em_execucao`

```sql
CREATE TABLE IF NOT EXISTS regras_em_execucao (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tabela_origem   VARCHAR(20) NOT NULL,   -- 'testes_windows' | 'testes_linux'
  id_pk           INT         NOT NULL,
  inicio_execucao DATETIME    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_regra (tabela_origem, id_pk)
) CHARACTER SET utf8mb4;
```

#### `historico_regras`

Registra automaticamente criação, edição, exclusão e mudanças de status.

```sql
CREATE TABLE IF NOT EXISTS historico_regras (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  tabela_origem   VARCHAR(20)  NOT NULL,
  id_pk_regra     INT          NOT NULL,
  acao            VARCHAR(30)  NOT NULL,   -- CRIACAO | EDICAO | EXCLUSAO | INICIO_EXECUCAO | FIM_EXECUCAO | CASO_TESTE_CRIADO | CASO_TESTE_STATUS
  campo_alterado  VARCHAR(100) NULL,
  valor_anterior  TEXT         NULL,
  valor_novo      TEXT         NULL,
  usuario         VARCHAR(200) NULL,
  data_hora       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_regra (tabela_origem, id_pk_regra)
) CHARACTER SET utf8mb4;
```

#### `casos_teste`

Casos de teste vinculados a cada regra com fluxo de execução.

```sql
CREATE TABLE IF NOT EXISTS casos_teste (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tabela_origem    VARCHAR(20)  NOT NULL,
  id_pk_regra      INT          NOT NULL,
  responsavel      VARCHAR(200) NULL,
  versao_bi        VARCHAR(50)  NULL,
  protocolo        VARCHAR(100) NULL,
  qtd_arquivos     VARCHAR(100) NULL,
  tamanho_arquivos VARCHAR(100) NULL,
  observacoes      TEXT         NULL,
  status ENUM('Pendente','Em Andamento','Aprovado','Reprovado') DEFAULT 'Pendente',
  motivo_reprovacao TEXT        NULL,
  data_inicio      DATETIME     NULL,
  data_fim         DATETIME     NULL,
  criado_em        DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_regra (tabela_origem, id_pk_regra)
) CHARACTER SET utf8mb4;
```

## Rotas de API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/dashboard` | KPIs e dados do dashboard |
| GET | `/api/testes?os=all\|windows\|linux` | Lista paginada de regras |
| POST | `/api/testes` | Criar nova regra |
| PUT | `/api/testes/[id]` | Atualizar regra (loga no histórico) |
| DELETE | `/api/testes/[id]` | Excluir regra (requer senha admin) |
| GET | `/api/listas` | Valores dos dropdowns |
| GET | `/api/execucao` | Regras em execução |
| POST | `/api/execucao` | Iniciar execução (marca como Em Andamento) |
| DELETE | `/api/execucao` | Encerrar execução |
| GET | `/api/historico?tabela=&id_pk=` | Histórico de alterações de uma regra |
| GET | `/api/casos-teste?tabela=&id_pk=` | Casos de teste de uma regra |
| POST | `/api/casos-teste` | Criar caso de teste |
| PUT | `/api/casos-teste/[id]` | Atualizar caso de teste |
| DELETE | `/api/casos-teste/[id]` | Excluir caso de teste |

## Funcionalidades

- **Dashboard**: KPIs, donut de status, barras Windows vs Linux, regras reprovadas, card de regras em execução
- **Iniciar Regra**: checkbox por linha na tabela — marca como "Em Andamento" e aparece no dashboard em tempo real
- **Testes**: listagem unificada (Todos/Windows/Linux), busca, filtros por status e protocolo
- **Edição rápida**: altera só o resultado (status) de uma regra
- **Edição completa**: edita todos os campos da regra
- **Histórico**: timeline de alterações por regra (criação, edições campo-a-campo, exclusão)
- **Casos de Teste**: vinculados a cada regra — fluxo Pendente → Em Andamento → Aprovado | Reprovado (com motivo)
- **Exclusão**: protegida por senha de admin validada **somente no backend**

## Segurança

- Prepared statements em todas as queries (`?` placeholders — sem SQL injection)
- Senha de exclusão validada via `process.env.ADMIN_DELETE_PASSWORD` — nunca exposta ao cliente
- Nomes de tabelas derivados de enums (nunca de input do usuário)

---

## Como Rodar o Projeto

### Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Node.js    | 18+           |
| npm        | 9+            |
| MySQL      | 8.0+          |

### 1. Clonar o repositório

```bash
git clone https://github.com/Matheusovc/painel-edi-esales.git
cd painel-edi-esales
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=testes_esales
ADMIN_DELETE_PASSWORD=senha_para_exclusao_de_regras
JWT_SECRET=troque_por_uma_string_aleatoria_longa
```

> **JWT_SECRET**: use qualquer string longa e aleatória. Exemplo de como gerar uma:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Preparar o banco de dados

Certifique-se de que o MySQL está rodando e o banco `testes_esales` existe.  
Se precisar criar as tabelas e views base, execute os scripts na ordem:

```bash
mysql -u root -p testes_esales < Testes_eSales.sql
mysql -u root -p testes_esales < Views_Dashboard.sql
```

As tabelas auxiliares (`regras_em_execucao`, `historico_regras`, `casos_teste`, `usuarios`) são criadas automaticamente pelo sistema na primeira vez que a API é chamada — não é necessário criar manualmente.

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse **http://localhost:3000**

Na primeira vez, crie um usuário pela tela de login clicando em **"Criar conta"**.

### 6. Build para produção

```bash
npm run build
npm start
```

### Estrutura de pastas relevante

```
src/
├── app/
│   ├── api/          # Rotas de API (Next.js Route Handlers)
│   ├── login/        # Página de autenticação
│   ├── testes/       # Página de regras
│   ├── listas/       # Página de listas
│   └── page.tsx      # Dashboard principal
├── components/
│   ├── dashboard/    # Cards, gráficos e tabelas do dashboard
│   ├── layout/       # TopNav, AppShell
│   ├── testes/       # Modais e tabela de testes
│   ├── chat/         # Chatbot flutuante
│   └── ui/           # Componentes base (liquid-glass, shaders, shadcn)
└── lib/
    ├── db.ts         # Pool de conexão MySQL (singleton)
    ├── auth.ts       # JWT (sign/verify)
    └── migrate.ts    # Criação automática de tabelas
```
