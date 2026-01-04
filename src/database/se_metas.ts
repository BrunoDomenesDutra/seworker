// worker/src/database/se_metas.ts

import { pool } from './pool'
import { logger } from '../logger'
import { SeMetaRow } from './types'

/**
 * Retorna todas as metas ativas (independente de tipo).
 */
export async function getActiveMetas(client?: any): Promise<SeMetaRow[]> {
  const queryClient = client || pool
  const res = (await queryClient.query(
    'SELECT id, name, goal_amount, active, created_at, priority FROM se_metas WHERE active = true ORDER BY priority ASC, name ASC'
  )) as { rows: SeMetaRow[] }
  logger.info('database', `DB SE Metas: fetched ${res.rows.length} active metas`)
  return res.rows
}

/**
 * Retorna apenas metas gerais ativas (priority > 0), ordenadas por priority.
 */
export async function getActiveGeneralMetas(client?: any): Promise<SeMetaRow[]> {
  const queryClient = client || pool
  const res = (await queryClient.query(
    'SELECT id, name, goal_amount, active, created_at, priority FROM se_metas WHERE active = true AND priority > 0 ORDER BY priority ASC'
  )) as { rows: SeMetaRow[] }
  logger.info('database', `DB SE Metas: fetched ${res.rows.length} active general metas`)
  return res.rows
}

/**
 * Busca uma meta ativa pelo nome exato (case-sensitive no banco, mas você deve passar lowercase).
 */
export async function findActiveMetaByName(name: string, client?: any): Promise<SeMetaRow | null> {
  const queryClient = client || pool
  const res = (await queryClient.query(
    'SELECT id, name, goal_amount, active, created_at, priority FROM se_metas WHERE active = true AND name = $1',
    [name]
  )) as { rows: SeMetaRow[] }
  return res.rows.length > 0 ? res.rows[0] : null
}
