// worker/src/database/index.ts
import { pool } from './pool'
import { logger } from '../logger'
import { SeDonationAllocationInsert, SeDonationInsert, SeMetaRow } from './types'
import { insertSeProcessedEvent, isEventProcessed } from './se_processed_events'
import { insertSeDonation } from './se_donations'
import { updateLastDonatedAt } from './se_worker_state'
import { getActiveMetas, getActiveGeneralMetas } from './se_metas'
import { insertDonationMetaAssociations } from './se_donation_meta'
import { insertDonationAllocations } from './se_donation_allocations'
import { getFullState } from './state'
import { io } from '../socketio/socket.server'

/**
 * Extrai hashtags válidas da mensagem (em lowercase, sem #).
 */
function extractHashtags(message: string | null): string[] {
  if (!message) return []
  const matches = message.match(/#([a-z0-9_]+)/gi)
  if (!matches) return []
  return matches.map((tag) => tag.substring(1).toLowerCase())
}

/**
 * Calcula o progresso atual de uma meta geral usando se_donation_allocations.
 */
async function getGeneralMetaCurrentAmount(metaId: number, client?: any): Promise<number> {
  const queryClient = client || pool
  const res = (await queryClient.query(
    `
    SELECT COALESCE(SUM(allocated_amount), 0) AS total
    FROM se_donation_allocations
    WHERE meta_id = $1
    `,
    [metaId]
  )) as { rows: { total: string }[] }

  return parseFloat(res.rows[0].total)
}

/**
 * Processa uma doação com suporte a:
 * - Meta temática (inteira, via se_donation_meta)
 * - Metas gerais cumulativas (parciais, via se_donation_allocations)
 */
export async function processSeTip(donation: SeDonationInsert): Promise<boolean> {
  const { externalId, message, donatedAt, amount, currency, username } = donation

  if (await isEventProcessed(externalId)) {
    logger.info('database', `Tip already processed: ${externalId}`)
    return false
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Insere a doação
    await insertSeDonation(donation, client)
    const donationRes = (await client.query('SELECT id FROM se_donations WHERE external_id = $1', [externalId])) as {
      rows: { id: number }[]
    }

    if (donationRes.rows.length === 0) {
      throw new Error(`Donation not found after insert: ${externalId}`)
    }
    const donationId = donationRes.rows[0].id

    // 2. Carrega metas ativas
    const activeMetas = await getActiveMetas(client)
    const activeGeneralMetas = await getActiveGeneralMetas(client)

    if (activeGeneralMetas.length === 0) {
      throw new Error('No active general metas available')
    }

    // 3. Resolve meta temática (se houver e for incompleta)
    const hashtags = extractHashtags(message)
    let thematicMetaId: number | null = null
    if (hashtags.length > 0) {
      for (const tag of hashtags) {
        const meta = activeMetas.find((m) => m.name === tag && m.priority === 0)
        if (meta) {
          // Para metas temáticas, usamos o valor TOTAL da doação (sem divisão)
          thematicMetaId = meta.id
          break
        }
      }
    }

    // 4. Associa meta temática (inteira)
    if (thematicMetaId !== null) {
      await insertDonationMetaAssociations(donationId, [thematicMetaId], client)
      logger.info(
        'database',
        `DB SE Donation Meta: donationId=${donationId} → thematic meta: ${
          activeMetas.find((m) => m.id === thematicMetaId)?.name
        }`
      )
    }

    // 5. Aloca valor nas metas gerais (com divisão, estilo AGDQ)
    let remainingAmount = amount
    const allocations: SeDonationAllocationInsert[] = []

    for (const meta of activeGeneralMetas) {
      if (remainingAmount <= 0) break

      const current = await getGeneralMetaCurrentAmount(meta.id, client)
      const goal = parseFloat(meta.goal_amount)
      const missing = goal - current

      if (missing <= 0) continue // meta já completa

      const allocated = Math.min(remainingAmount, missing)
      allocations.push({
        donation_id: donationId,
        meta_id: meta.id,
        allocated_amount: allocated,
      })

      remainingAmount -= allocated
    }

    // 6. Insere alocações (mesmo que remainingAmount > 0, alocamos o máximo possível)
    if (allocations.length > 0) {
      const metaNames = allocations
        .map((alloc) => {
          const meta = activeGeneralMetas.find((m) => m.id === alloc.meta_id)
          return meta ? `${meta.name} (${alloc.allocated_amount})` : `unknown`
        })
        .join(', ')
      logger.info(
        'database',
        `DB SE Donation Allocations: donationId=${donationId} (${amount} ${currency}) → [${metaNames}]`
      )
      await insertDonationAllocations(allocations, client)
    } else {
      logger.warn(
        'database',
        `DB SE Donation Allocations: donationId=${donationId} could not be allocated to any general meta`
      )
    }

    // 7. Atualiza last_donated_at e marca como processado
    await updateLastDonatedAt(donatedAt, client)
    await insertSeProcessedEvent(externalId, client)

    await client.query('COMMIT')
    logger.info('database', `Tip fully processed: ${externalId} (donationId=${donationId})`)

    // 8. Emite estado atualizado via Socket.IO
    if (io?.sockets) {
      try {
        const state = await getFullState()
        io.emit('fullState', state)
        logger.info('database', 'Emitted updated fullState via Socket.IO')
      } catch (emitError) {
        logger.error('database', 'Failed to emit fullState', {
          error: String(emitError),
        })
      }
    }

    return true
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error('database', `Failed to process tip idempotently: ${externalId}`, {
      error: String(error),
    })
    throw error
  } finally {
    client.release()
  }
}
