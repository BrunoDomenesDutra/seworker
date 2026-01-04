// worker/src/database/index.ts
import { pool } from './pool'

import { logger } from '../logger'
import { SeDonationInsert } from './types'
import { insertSeProcessedEvent, isEventProcessed } from './se_processed_events'
import { insertSeDonation } from './se_donations'

/**
 * Processa uma doação do StreamElements de forma **idempotente e atômica**.
 * Retorna `true` se foi processada agora, `false` se já existia.
 */
export async function processSeTip(donation: SeDonationInsert): Promise<boolean> {
  const { externalId } = donation

  // Verificação rápida antes de abrir transação
  if (await isEventProcessed(externalId)) {
    logger.info('database', `DB Index: Tip already processed: ${externalId}`)
    return false
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Insere doação (com ON CONFLICT, mas dentro da transação)
    await insertSeDonation(donation, client)

    // 2. Marca como processado
    await insertSeProcessedEvent(externalId, client)

    await client.query('COMMIT')
    logger.info('database', `DB Index: Tip processed successfully: ${externalId}`)
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('database', `DB Index: Failed to process tip: ${externalId}`, { error: String(error) })
    throw error
  } finally {
    client.release()
  }
}
