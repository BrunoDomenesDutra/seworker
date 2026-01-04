// worker/src/socketio/socket.server.ts

import { Server } from 'socket.io'

export const io = new Server({
  cors: { origin: '*' },
})

export function startSocket(port: number) {
  io.listen(port)
  console.log('[socket] listening on', port)
}
