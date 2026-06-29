import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import pool from '@/lib/db'

const DB_SCHEMA = `Banco MySQL do Painel EDI e.Sales (gerenciamento de testes de protocolos EDI).

TABELAS PRINCIPAIS:
testes_windows, testes_linux — mesmas colunas:
  id_pk INT PK, id VARCHAR, nome_da_regra VARCHAR, configuracao_da_regra VARCHAR,
  executor_da_regra VARCHAR, tipo_de_regra VARCHAR, protocolo_parceiro VARCHAR,
  resultado ENUM('Aprovado','Reprovado','Em Andamento','Não Iniciado','Aguardando'),
  criticidade_issue ENUM('Alta','Média','Baixa'), issue TEXT,
  versao_do_edie VARCHAR, build VARCHAR, observacoes TEXT

regras_em_execucao:
  id INT PK, tabela_origem ENUM('testes_windows','testes_linux'), id_pk INT, inicio_execucao DATETIME

historico_regras:
  id INT PK, tabela_origem VARCHAR, id_pk_regra INT,
  acao ENUM('CRIACAO','EDICAO','EXCLUSAO','INICIO_EXECUCAO','FIM_EXECUCAO','CASO_TESTE_CRIADO','CASO_TESTE_STATUS'),
  campo_alterado VARCHAR, valor_anterior TEXT, valor_novo TEXT, usuario VARCHAR, data_hora DATETIME

casos_teste:
  id INT PK, tabela_origem VARCHAR, id_pk_regra INT, responsavel VARCHAR,
  versao_bi VARCHAR, protocolo VARCHAR, qtd_arquivos VARCHAR, tamanho_arquivos VARCHAR,
  status ENUM('Pendente','Em Andamento','Aprovado','Reprovado'), motivo_reprovacao TEXT,
  data_inicio DATETIME, data_fim DATETIME, criado_em DATETIME

VIEWS (prefira para relatórios):
vw_dashboard — total_regras, aprovados, reprovados, em_andamento, aguardando, nao_iniciado, pct_aprovados, pct_reprovados
vw_resumo_status — status, total, windows, linux, pct
vw_resumo_por_so — origem('windows'|'linux'), total, aprovados, reprovados, nao_iniciado
vw_regras_reprovadas — localizacao, id, nome_da_regra, resultado, criticidade

FILTROS TEMPORAIS:
Hoje: DATE(data_hora) = CURDATE()
Esta semana: YEARWEEK(data_hora,1) = YEARWEEK(NOW(),1)
Este mês: MONTH(data_hora)=MONTH(NOW()) AND YEAR(data_hora)=YEAR(NOW())
Sempre use LIMIT 50 em queries nas tabelas principais.`

const SYSTEM_PROMPT = `Você é um assistente de análise do Painel EDI e.Sales. Responda SEMPRE em português brasileiro.

${DB_SCHEMA}

Retorne SOMENTE JSON válido neste formato exato:
{"sql":"SELECT ...","answer":"resposta amigável em português"}

Regras obrigatórias:
- Gere APENAS queries SELECT ou WITH (CTE) — nunca UPDATE, DELETE, INSERT, DROP, ALTER
- Se não conseguir responder com SQL: {"sql":null,"answer":"explicação do porquê"}
- Para combinar Windows+Linux use UNION ALL entre testes_windows e testes_linux
- Seja direto e conciso na resposta (máximo 2 linhas)
- Retorne JSON puro, sem markdown`

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({
      answer: 'Assistente IA não configurado. Adicione GROQ_API_KEY no arquivo .env para usar este recurso.',
      rows: [],
      sql: null,
    })
  }

  try {
    const { message } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      max_tokens: 1024,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const raw = (completion.choices[0].message.content ?? '').trim()

    let parsed: { sql: string | null; answer: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ answer: raw, rows: [], sql: null })
    }

    if (!parsed.sql) {
      return NextResponse.json({ answer: parsed.answer, rows: [], sql: null })
    }

    const upper = parsed.sql.trim().toUpperCase().replace(/\s+/g, ' ')
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
      return NextResponse.json({
        answer: 'Por segurança, só executo consultas de leitura (SELECT). Tente reformular a pergunta.',
        rows: [],
        sql: parsed.sql,
      })
    }

    try {
      const [rows] = await pool.execute(parsed.sql)
      return NextResponse.json({
        answer: parsed.answer,
        rows: Array.isArray(rows) ? rows.slice(0, 50) : [],
        sql: parsed.sql,
      })
    } catch (sqlErr: unknown) {
      const msg = sqlErr instanceof Error ? sqlErr.message : String(sqlErr)
      return NextResponse.json({
        answer: `A consulta gerada contém um erro: ${msg}. Tente reformular a pergunta.`,
        rows: [],
        sql: parsed.sql,
        error: true,
      })
    }
  } catch (error: unknown) {
    console.error('[chat/POST]', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      answer: `Erro ao processar: ${msg}`,
      rows: [],
      sql: null,
      error: true,
    })
  }
}
