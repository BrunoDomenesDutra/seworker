// worker/src/database/se_donation_meta.ts
import { pool } from './pool'
import { logger } from '../logger'

/**
 * Associa uma doação a múltiplas metas.
 * Aceita um array de meta_id e insere uma linha para cada.
 */
export async function insertDonationMetaAssociations(
  donationId: number,
  metaIds: number[],
  client?: any
): Promise<void> {
  if (metaIds.length === 0) {
    logger.warn('database', `DB SE Donation Meta: no metas to associate for donationId=${donationId}`)
    return
  }

  const queryClient = client || pool

  // Prepara valores para inserção em lote
  const values: any[] = []
  const placeholders = metaIds
    .map((_, i) => {
      values.push(donationId)
      values.push(metaIds[i])
      return `($${values.length - 1}, $${values.length})`
    })
    .join(', ')

  const query = `
    INSERT INTO se_donation_meta (donation_id, meta_id)
    VALUES ${placeholders}
    ON CONFLICT (donation_id, meta_id) DO NOTHING
  `

  try {
    await queryClient.query(query, values)
    logger.info('database', `DB SE Donation Meta: associated donationId=${donationId} to ${metaIds.length} meta(s)`)
  } catch (error) {
    logger.error('database', `DB SE Donation Meta ERROR: failed to associate donationId=${donationId}`, {
      error: String(error),
    })
    throw error
  }
}
