// worker/src/database/state.ts
import { pool } from './pool'
import { FullState, MetaState } from './types'
import { logger } from '../logger'

/**
 * Calcula o estado completo do sistema:
 * - Total global (soma de todas as doações)
 * - Progresso de cada meta (temáticas + gerais)
 */
export async function getFullState(): Promise<FullState> {
  const client = await pool.connect()
  try {
    // 1. Total global: soma de TUDO em se_donations
    const totalRes = (await client.query('SELECT COALESCE(SUM(amount), 0) AS total FROM se_donations')) as {
      rows: { total: string }[]
    }
    const totalAmount = parseFloat(totalRes.rows[0].total)

    // 2. Metas temáticas: via se_donation_meta
    const thematicRes = (await client.query(
      `
      SELECT
        m.id,
        m.name,
        m.goal_amount,
        m.active,
        m.completed_at,  -- 👈 adicionado
        COALESCE(SUM(d.amount), 0) AS current
      FROM se_metas m
      LEFT JOIN se_donation_meta dm ON m.id = dm.meta_id
      LEFT JOIN se_donations d ON dm.donation_id = d.id
      WHERE m.priority = 0
      GROUP BY m.id, m.name, m.goal_amount, m.active, m.completed_at
      ORDER BY m.name
      `
    )) as {
      rows: Array<{
        id: string
        active: boolean
        name: string
        goal_amount: string
        current: string
        completed_at: string | null
      }>
    }

    // 3. Metas gerais: via se_donation_allocations
    const generalRes = (await client.query(
      `
      SELECT
        m.id,
        m.name,
        m.goal_amount,
        m.active,
        COALESCE(SUM(da.allocated_amount), 0) AS current
      FROM se_metas m
      LEFT JOIN se_donation_allocations da ON m.id = da.meta_id
      WHERE m.priority > 0
      GROUP BY m.id, m.name, m.goal_amount, m.active
      ORDER BY m.priority
      `
    )) as { rows: { id: string; active: boolean; name: string; goal_amount: string; current: string }[] }

    const metas: MetaState[] = [
      ...thematicRes.rows.map((row) => ({
        id: parseInt(row.id, 10),
        name: row.name,
        current: parseFloat(row.current),
        goal: parseFloat(row.goal_amount),
        active: row.active,
        completed_at: row.completed_at, // string | null
      })),
      ...generalRes.rows.map((row) => ({
        id: parseInt(row.id, 10),
        name: row.name,
        current: parseFloat(row.current),
        goal: parseFloat(row.goal_amount),
        active: row.active, // 👈 boolean
      })),
    ]

    return { global: { totalAmount }, metas }
  } catch (error) {
    logger.error('database', 'Failed to compute FullState', { error: String(error) })
    throw error
  } finally {
    client.release()
  }
}
