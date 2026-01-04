// worker/src/socketio/socket.server.ts
import { Server } from 'socket.io'
import { logger } from '../logger'
import { initSocketEvents } from './socket.events'

let io: Server

export function createSocketIOServer(server: any): Server {
  io = new Server(server, {
    cors: {
      origin: '*', // Ajuste depois para seu domínio de produção
      methods: ['GET', 'POST'],
    },
  })

  logger.info('socketio', 'Socket.IO server initialized')

  // Registra os eventos
  initSocketEvents(io)

  return io
}

// Exporta a instância para uso em outros módulos (ex: database)
export { io }
