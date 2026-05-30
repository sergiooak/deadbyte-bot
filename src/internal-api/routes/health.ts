import { eventHandler } from 'h3'
import type { BotApp } from '../../app/create-bot-app.js'

export function healthRoute(app: BotApp) {
  return eventHandler(() => ({
    ok: true,
    instanceId: app.config.instanceId,
    mode: app.config.mode,
    uptime: Math.floor((Date.now() - app.state.startedAt) / 1000)
  }))
}
