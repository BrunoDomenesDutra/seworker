// worker/src/socketio/socket.events.ts

import { io } from './socket.server.js'

export function emitStateUpdate(state: any) {
  io.emit('state:update', state)
}
