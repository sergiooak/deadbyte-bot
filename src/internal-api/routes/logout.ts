import { eventHandler } from 'h3'
import type { BotApp } from '../../app/create-bot-app.js'

export function logoutRoute(app: BotApp) {
  return eventHandler(async () => {
    await app.client.logout()
    return { ok: true }
  })
}
