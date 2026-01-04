import { processSeTip } from '../database'
import { pool } from '../database/pool'
import { logger } from '../logger'
import { ActivityMessageType, TipActivityData } from './types'

export async function handleSEMessage(raw: string) {
  let parsed: ActivityMessageType

  try {
    parsed = JSON.parse(raw)
  } catch {
    return
  }

  if (parsed.type !== 'message') return
  if (parsed.topic !== 'channel.activities') return
  if (parsed.data.type !== 'tip') return

  const externalId = parsed.data.activityId

  const tip = parsed.data.data as TipActivityData
  const donation = {
    externalId: parsed.data.activityId,
    username: tip.username,
    amount: tip.amount,
    currency: tip.currency,
    message: tip.message ?? null,
    donatedAt: parsed.data.createdAt,
  }

  logger.info('streamelements', 'SE Handler: Tip received', donation)

  try {
    const isNew = await processSeTip(donation)
    if (isNew) {
      logger.info('streamelements', 'SE Handler: Tip processed', { externalId: donation.externalId })
    } else {
      logger.info('streamelements', 'SE Handler: Tip duplicate', { externalId: donation.externalId })
    }
  } catch (error) {
    logger.error('streamelements', 'SE Handler: Failed to process tip', { error: String(error) })
  }
}
