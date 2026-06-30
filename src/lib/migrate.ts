import pool from './db'

let migrated = false

export async function ensureTables(): Promise<void> {
  if (migrated) return
  migrated = true
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS regras_em_execucao (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        tabela_origem VARCHAR(20)  NOT NULL,
        id_pk         INT          NOT NULL,
        inicio_execucao DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_regra (tabela_origem, id_pk)
      ) CHARACTER SET utf8mb4
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historico_regras (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        tabela_origem VARCHAR(20)  NOT NULL,
        id_pk_regra   INT          NOT NULL,
        acao          VARCHAR(30)  NOT NULL,
        campo_alterado VARCHAR(100) NULL,
        valor_anterior TEXT        NULL,
        valor_novo     TEXT        NULL,
        usuario        VARCHAR(200) NULL,
        data_hora      DATETIME    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_regra (tabela_origem, id_pk_regra)
      ) CHARACTER SET utf8mb4
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS casos_teste (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        tabela_origem   VARCHAR(20)  NOT NULL,
        id_pk_regra     INT          NOT NULL,
        responsavel     VARCHAR(200) NULL,
        versao_bi       VARCHAR(50)  NULL,
        protocolo       VARCHAR(100) NULL,
        qtd_arquivos    VARCHAR(100) NULL,
        tamanho_arquivos VARCHAR(100) NULL,
        observacoes     TEXT         NULL,
        status ENUM('Pendente','Em Andamento','Aprovado','Reprovado') DEFAULT 'Pendente',
        motivo_reprovacao TEXT       NULL,
        data_inicio     DATETIME     NULL,
        data_fim        DATETIME     NULL,
        criado_em       DATETIME     DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_regra (tabela_origem, id_pk_regra)
      ) CHARACTER SET utf8mb4
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bitrix_cards (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        tabela_origem VARCHAR(20)  NOT NULL,
        id_pk_regra   INT          NOT NULL,
        deal_id       INT          NOT NULL,
        titulo        VARCHAR(500) NULL,
        status        ENUM('aberto','fechado') DEFAULT 'aberto',
        criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_regra (tabela_origem, id_pk_regra),
        INDEX idx_deal (deal_id)
      ) CHARACTER SET utf8mb4
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        nome          VARCHAR(100) NOT NULL,
        email         VARCHAR(200) NOT NULL UNIQUE,
        senha_hash    VARCHAR(255) NOT NULL,
        role          ENUM('admin','usuario') DEFAULT 'usuario',
        ativo         TINYINT(1) DEFAULT 1,
        criado_em     DATETIME DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) CHARACTER SET utf8mb4
    `)
    // Migrate existing usuarios table — add columns if missing
    for (const sql of [
      "ALTER TABLE usuarios ADD COLUMN role ENUM('admin','usuario') DEFAULT 'usuario'",
      "ALTER TABLE usuarios ADD COLUMN ativo TINYINT(1) DEFAULT 1",
      "ALTER TABLE usuarios ADD COLUMN atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    ]) {
      try { await pool.query(sql) } catch { /* column already exists */ }
    }
  } catch (e) {
    console.error('[migrate] Error creating tables:', e)
  }
}
