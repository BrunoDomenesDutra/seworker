// worker/src/database/seDonations.ts
import { logger } from '../logger'
import { pool } from './pool'
import { SeDonationInsert } from './types'

export async function insertSeDonation(input: SeDonationInsert, client?: any): Promise<void> {
  const { externalId, username, amount, currency, message, donatedAt } = input

  logger.info(
    'database',
    `DB SE Donations: inserting donation externalId=${externalId} user=${username} amount=${amount} ${currency}`
  )

  const queryClient = client || pool

  try {
    await queryClient.query(
      `
      INSERT INTO se_donations (
        external_id,
        username,
        amount,
        currency,
        message,
        donated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (external_id) DO NOTHING
      `,
      [externalId, username, amount, currency, message, donatedAt]
    )

    logger.info('database', `DB SE Donations: donation saved externalId=${externalId}`)
  } catch (error) {
    logger.error('database', `DB SE Donations: failed to insert donation externalId=${externalId} | ${String(error)}`)
    throw error
  }
}
