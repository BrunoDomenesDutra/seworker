// worker/src/database/seWorkerState.ts
import { pool } from './pool'
import { logger } from '../logger'

/**
 * Retorna o último timestamp processado.
 * Se não existir, retorna null.
 */
export async function getLastDonatedAt(client?: any): Promise<string | null> {
  const queryClient = client || pool
  const res = await queryClient.query('SELECT last_donated_at FROM se_worker_state WHERE id = true')
  return res.rows.length > 0 ? res.rows[0].last_donated_at : null
}

/**
 * Atualiza o último timestamp processado.
 * Usa ON CONFLICT para garantir que a linha exista.
 */
export async function updateLastDonatedAt(newTimestamp: string, client?: any): Promise<void> {
  const queryClient = client || pool
  await queryClient.query(
    `
    INSERT INTO se_worker_state (id, last_donated_at)
    VALUES (true, $1)
    ON CONFLICT (id) DO UPDATE
    SET last_donated_at = EXCLUDED.last_donated_at
    `,
    [newTimestamp]
  )
  logger.info('database', `DB: updated last_donated_at to ${newTimestamp}`)
}
