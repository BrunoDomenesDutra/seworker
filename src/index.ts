// worker/src/index.ts

import 'dotenv/config'
import { startSocket } from './socket.js'
import seMain from './streamelements/main'

startSocket(Number(process.env.SOCKET_PORT))
seMain()
