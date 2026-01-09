// worker/src/database/types.ts

export interface SeDonationInsert {
  externalId: string
  username: string
  amount: number
  currency: string
  message: string | null
  donatedAt: string // ISO string
}

export interface SeDonationRow extends SeDonationInsert {
  id: number
  received_at: string
}

export interface SeMetaRow {
  id: number
  name: string
  goal_amount: string
  active: boolean
  created_at: string
  completed_at: string | null // ← adicione esta linha
  priority: number
}

export interface SeDonationMetaInsert {
  donation_id: number
  meta_id: number
}

// ✅ Novo: alocação parcial para metas gerais
export interface SeDonationAllocationInsert {
  donation_id: number
  meta_id: number
  allocated_amount: number
}

export interface SeWorkerStateRow {
  id: boolean
  last_donated_at: string
}

export interface SeProcessedEventInsert {
  external_id: string
}

export interface GlobalState {
  totalAmount: number
}

export interface MetaState {
  id?: number
  active?: boolean
  name: string
  current: number
  goal: number
  completed_at?: string | null // opcional no estado exposto
}

export interface FullState {
  global: GlobalState
  metas: MetaState[]
}
