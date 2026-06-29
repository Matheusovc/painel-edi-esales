export interface Teste {
  id_pk: number
  id: string | null
  nome_da_regra: string
  configuracao_da_regra: string
  executor_da_regra: string
  tipo_de_regra: string
  protocolo_parceiro: string
  clientes_utilizam_funcionalidade: string
  resultado_esperado: string
  detalhamento_da_execucao_do_teste: string
  resultado: string
  criticidade_issue: string
  issue: string
  versao_do_edie: string
  build: string
  observacoes: string
  tabela_origem?: 'testes_windows' | 'testes_linux'
}

export interface DashboardKpi {
  total_regras: number
  aprovados: number
  reprovados: number
  em_andamento: number
  aguardando: number
  volumetria: number
  nao_iniciado: number
  pct_aprovados: number
  pct_reprovados: number
}

export interface ResumoStatus {
  status: string
  total: number
  windows: number
  linux: number
  pct: number
}

export interface ResumoPorSo {
  origem: string
  total: number
  aprovados: number
  reprovados: number
  nao_iniciado: number
}

export interface RegraReprovada {
  localizacao: string
  id: string
  nome_da_regra: string
  resultado: string
  criticidade: string
}

export interface ListaItem {
  id: number
  categoria: string
  valor: string
}

export interface Listas {
  [categoria: string]: string[]
}

export interface TestesResponse {
  data: Teste[]
  total: number
  page: number
  limit: number
}

export interface ExecucaoRegra {
  id: number
  tabela_origem: 'testes_windows' | 'testes_linux'
  id_pk: number
  inicio_execucao: string
  nome_da_regra: string
  protocolo_parceiro: string
  executor_da_regra: string
}

export interface HistoricoItem {
  id: number
  tabela_origem: string
  id_pk_regra: number
  acao: string
  campo_alterado: string | null
  valor_anterior: string | null
  valor_novo: string | null
  usuario: string | null
  data_hora: string
}

export interface CasoTeste {
  id: number
  tabela_origem: string
  id_pk_regra: number
  responsavel: string | null
  versao_bi: string | null
  protocolo: string | null
  qtd_arquivos: string | null
  tamanho_arquivos: string | null
  observacoes: string | null
  status: 'Pendente' | 'Em Andamento' | 'Aprovado' | 'Reprovado'
  motivo_reprovacao: string | null
  data_inicio: string | null
  data_fim: string | null
  criado_em: string
}
