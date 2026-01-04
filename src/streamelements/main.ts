// worker/src/streamelements/main.ts

import WebSocket from 'ws'
import { randomUUID } from 'crypto'

import { handleSEMessage } from './handler'
import { logger } from '../logger'

export default function seMain() {
  const ws = new WebSocket('wss://astro.streamelements.com')
  logger.info('streamelements', 'SE Main: Starting connection')

  ws.on('open', () => {
    logger.info('streamelements', 'SE Main: Connected to Astro WS')

    const subscribeMessage = {
      type: 'subscribe',
      nonce: randomUUID(),
      data: {
        topic: 'channel.activities',
        room: process.env.STREAMELEMENTS_CHANNEL_ID,
        token: process.env.STREAMELEMENTS_JWT,
        token_type: 'jwt',
      },
    }

    ws.send(JSON.stringify(subscribeMessage))
    logger.info('streamelements', 'SE Main: Subscribed to channel.activities')
  })

  ws.on('message', (raw) => {
    const payload = raw.toString()
    logger.info('streamelements', `SE Main RAW: ${payload}`)

    handleSEMessage(payload)
  })

  ws.on('close', (code, reason) => {
    logger.info('streamelements', `SE Main: WS closed ${code} ${reason}`)
  })

  ws.on('error', (err) => {
    logger.error('streamelements', `SE Main WS error: ${err}`)
  })
}
