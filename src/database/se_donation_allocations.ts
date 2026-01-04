// worker/src/database/seDonationAllocations.ts
import { pool } from './pool'
import { logger } from '../logger'
import { SeDonationAllocationInsert } from './types'

/**
 * Insere múltiplas alocações parciais de uma doação para metas gerais.
 * Cada alocação tem um valor específico (allocated_amount).
 */
export async function insertDonationAllocations(
  allocations: SeDonationAllocationInsert[],
  client?: any
): Promise<void> {
  if (allocations.length === 0) {
    logger.warn('database', 'DB SE Donation Allocations: no allocations to insert')
    return
  }

  const queryClient = client || pool

  // Prepara valores e placeholders para inserção em lote
  const values: any[] = []
  const placeholders = allocations
    .map((alloc, i) => {
      const offset = i * 3
      values.push(alloc.donation_id)
      values.push(alloc.meta_id)
      values.push(alloc.allocated_amount)
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`
    })
    .join(', ')

  const query = `
    INSERT INTO se_donation_allocations (donation_id, meta_id, allocated_amount)
    VALUES ${placeholders}
  `

  try {
    await queryClient.query(query, values)
    const total = allocations.reduce((sum, a) => sum + a.allocated_amount, 0)
    logger.info(
      'database',
      `DB SE Donation Allocations: allocated $${total.toFixed(2)} across ${allocations.length} meta(s)`
    )
  } catch (error) {
    logger.error('database', 'DB SE Donation Allocations ERROR: failed to insert allocations', {
      error: String(error),
    })
    throw error
  }
}
