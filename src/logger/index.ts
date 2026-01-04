// worker/src/logger.ts

import fs from 'fs'
import path from 'path'
import { LogEntry, LogLevel } from './types'

const LOG_DIR = path.resolve('logs')

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

function writeLog(file: string, line: string) {
  fs.appendFileSync(path.join(LOG_DIR, file), line + '\n')
}

function format(level: LogLevel, scope: string, message: string, data?: unknown) {
  const base = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${message}`
  return data ? `${base} | ${JSON.stringify(data)}` : base
}

export const logger = {
  info(scope: string, message: string, data?: unknown) {
    writeLog(`${scope}.log`, format('info', scope, message, data))
  },

  warn(scope: string, message: string, data?: unknown) {
    writeLog(`${scope}.log`, format('warn', scope, message, data))
  },

  error(scope: string, message: string, data?: unknown) {
    writeLog('errors.log', format('error', scope, message, data))
  },
}
