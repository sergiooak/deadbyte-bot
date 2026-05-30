import { eventHandler } from 'h3'
import type { BotApp } from '../../app/create-bot-app.js'

export function shutdownRoute(app: BotApp) {
  return eventHandler(async () => {
    setTimeout(() => {
      void app.shutdown()
    }, 10)
    return { ok: true, shuttingDown: true }
  })
}
