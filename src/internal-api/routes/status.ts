import { eventHandler } from 'h3'
import type { BotApp } from '../../app/create-bot-app.js'
import { formatUptime } from '../../app/create-bot-app.js'

export function statusRoute(app: BotApp) {
  return eventHandler(async () => ({
    ok: true,
    status: app.state.status,
    instanceId: app.config.instanceId,
    clientId: app.config.clientId,
    mode: app.config.mode,
    uptime: formatUptime(Date.now() - app.state.startedAt),
    whatsappState: app.client.getState ? await app.client.getState() : undefined,
    internalApi: app.config.internalApi
  }))
}
