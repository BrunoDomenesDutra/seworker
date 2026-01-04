// worker/src/index.ts

import 'dotenv/config'

import seMain from './streamelements/main'
import { createSocketIOServer } from './socketio/socket.server'

createSocketIOServer(Number(process.env.SOCKET_PORT))
seMain()
