// worker/src/database/seProcessedEvents.ts
import { pool } from './pool'
import { logger } from '../logger'

export async function isEventProcessed(externalId: string): Promise<boolean> {
  const res = await pool.query('SELECT 1 FROM se_processed_events WHERE external_id = $1', [externalId])
  return res.rows.length > 0
}

export async function insertSeProcessedEvent(externalId: string, client?: any): Promise<void> {
  const queryClient = client || pool
  await queryClient.query('INSERT INTO se_processed_events (external_id) VALUES ($1)', [externalId])
  logger.info('database', `DB Se Processed Events: Marked event as processed: ${externalId}`)
}
