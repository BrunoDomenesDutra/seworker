// worker/src/socketio/socket.events.ts
import { Server, Socket } from 'socket.io'
import { logger } from '../logger'
import { getFullState } from '../database/state'

export function initSocketEvents(io: Server): void {
  io.on('connection', (socket: Socket) => {
    logger.info('socketio', `User connected: ${socket.id}`)

    // Envia o estado atual ao se conectar
    getFullState()
      .then((state) => {
        socket.emit('fullState', state)
      })
      .catch((error) => {
        logger.error('socketio', 'Failed to send initial fullState', {
          error: String(error),
        })
      })

    socket.on('disconnect', () => {
      logger.info('socketio', `User disconnected: ${socket.id}`)
    })
  })
}
