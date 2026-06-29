-- =====================================================================
-- Views de resumo / Dashboard  ·  banco testes_esales
-- Atualizam-se automaticamente conforme os testes sao preenchidos.
-- =====================================================================
USE `testes_esales`;

-- 1) Visao unificada dos testes (Windows + Linux) com status normalizado
DROP VIEW IF EXISTS `vw_testes`;
CREATE VIEW `vw_testes` AS
SELECT 'Windows' AS origem, id, nome_da_regra, tipo_de_regra, protocolo_parceiro,
       clientes_utilizam_funcionalidade,
       COALESCE(NULLIF(TRIM(resultado), ''), 'Não Iniciado') AS status,
       criticidade_issue, issue
FROM testes_windows
UNION ALL
SELECT 'Linux', id, nome_da_regra, tipo_de_regra, protocolo_parceiro,
       clientes_utilizam_funcionalidade,
       COALESCE(NULLIF(TRIM(resultado), ''), 'Não Iniciado') AS status,
       criticidade_issue, issue
FROM testes_linux;

-- 2) Resumo por status (total, Windows, Linux)
DROP VIEW IF EXISTS `vw_resumo_status`;
CREATE VIEW `vw_resumo_status` AS
SELECT status,
       COUNT(*)                                          AS total,
       SUM(origem = 'Windows')                           AS windows,
       SUM(origem = 'Linux')                             AS linux,
       ROUND(100 * COUNT(*) / (SELECT COUNT(*) FROM vw_testes), 1) AS pct
FROM vw_testes
GROUP BY status
ORDER BY total DESC;

-- 3) Dashboard (KPIs em uma unica linha, como o painel da planilha)
DROP VIEW IF EXISTS `vw_dashboard`;
CREATE VIEW `vw_dashboard` AS
SELECT
  COUNT(*)                                          AS total_regras,
  SUM(status = 'Aprovado')                          AS aprovados,
  SUM(status = 'Reprovado')                         AS reprovados,
  SUM(status = 'Em Andamento')                      AS em_andamento,
  SUM(status = 'Aguardando Ação')                   AS aguardando,
  SUM(status = 'Volumetria')                        AS volumetria,
  SUM(status = 'Não Iniciado')                      AS nao_iniciado,
  ROUND(100 * SUM(status = 'Aprovado')  / COUNT(*), 1) AS pct_aprovados,
  ROUND(100 * SUM(status = 'Reprovado') / COUNT(*), 1) AS pct_reprovados
FROM vw_testes;

-- 4) Regras reprovadas / com erro (atualizacao automatica)
DROP VIEW IF EXISTS `vw_regras_reprovadas`;
CREATE VIEW `vw_regras_reprovadas` AS
SELECT origem AS localizacao, id, nome_da_regra, status AS resultado, criticidade_issue AS criticidade
FROM vw_testes
WHERE status IN ('Reprovado')
   OR (issue IS NOT NULL AND TRIM(issue) <> '')
ORDER BY origem, id;

-- 5) Resumo por sistema operacional
DROP VIEW IF EXISTS `vw_resumo_por_so`;
CREATE VIEW `vw_resumo_por_so` AS
SELECT origem,
       COUNT(*)                     AS total,
       SUM(status = 'Aprovado')     AS aprovados,
       SUM(status = 'Reprovado')    AS reprovados,
       SUM(status = 'Não Iniciado') AS nao_iniciado
FROM vw_testes
GROUP BY origem;
