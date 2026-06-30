const BASE = () => {
  const url = process.env.BITRIX_WEBHOOK_URL?.replace(/\/$/, '')
  if (!url) throw new Error('BITRIX_WEBHOOK_URL não configurado no .env')
  return url
}

export interface BitrixDeal {
  ID: string
  TITLE: string
  STAGE_ID: string
  CATEGORY_ID: string
  COMMENTS: string
  DATE_CREATE: string
  DATE_MODIFY: string
  CLOSED: string
}

async function call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const url = `${BASE()}/${method}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10_000),
  })
  const json = await res.json()
  if (json.error) {
    throw new Error(json.error_description ?? json.error)
  }
  return json.result as T
}

export async function testConnection() {
  return call<{ ID: string; NAME: string; EMAIL: string }>('profile')
}

export async function listCategories() {
  return call<{ items: Array<{ ID: string; NAME: string }> }>('crm.dealcategory.list')
}

export async function createDeal(fields: {
  title: string
  categoryId: number
  stageId?: string
  comment?: string
}) {
  return call<number>('crm.deal.add', {
    fields: {
      TITLE: fields.title,
      CATEGORY_ID: fields.categoryId,
      ...(fields.stageId && { STAGE_ID: fields.stageId }),
      ...(fields.comment && { COMMENTS: fields.comment }),
    },
  })
}

export async function updateDeal(dealId: number, fields: Record<string, unknown>) {
  return call<boolean>('crm.deal.update', { id: dealId, fields })
}

export async function closeDeal(dealId: number) {
  return call<boolean>('crm.deal.update', {
    id: dealId,
    fields: { CLOSED: 'Y', STAGE_ID: 'WON' },
  })
}

export async function getDeal(dealId: number) {
  return call<BitrixDeal>('crm.deal.get', { id: dealId })
}

export async function addComment(dealId: number, text: string) {
  return call<number>('crm.timeline.comment.add', {
    fields: { ENTITY_TYPE: 'deal', ENTITY_ID: dealId, COMMENT: text },
  })
}
