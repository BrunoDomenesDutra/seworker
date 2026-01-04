// worker/src/index.ts

import 'dotenv/config'

import seMain from './streamelements/main'
import { startSocket } from './socketio/socket.server'

startSocket(Number(process.env.SOCKET_PORT))
seMain()
