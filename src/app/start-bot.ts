import { DeadByteEventNames, type ResolvedDeadByteConfig } from '@deadbyte/runtime'
import { createEventLogger } from '../logging/create-event-logger.js'
import { deadbyteBot } from '../bot/deadbyte.bot.js'
import { createInternalApiServer } from '../internal-api/create-server.js'
import { createWhatsappClient } from '../whatsapp/create-client.js'
import { registerWhatsappEvents } from '../whatsapp/whatsapp-events.js'
import { createBotApp, type BotApp } from './create-bot-app.js'

export async function startBot(config: ResolvedDeadByteConfig, options: { pairPhone?: string } = {}): Promise<BotApp> {
  const events = createEventLogger(config)
  const client = createWhatsappClient(config, { pairPhone: options.pairPhone })
  const app = createBotApp({
    bot: deadbyteBot,
    config,
    client,
    events
  })

  if (options.pairPhone) {
    app.state.pairing = { phoneNumber: options.pairPhone, code: '', updatedAt: new Date().toISOString() }
  }
  registerWhatsappEvents(app)
  app.state.status = 'starting'

  await events.emit({
    id: crypto.randomUUID(),
    name: DeadByteEventNames.RuntimeStarted,
    level: 'info',
    instanceId: config.instanceId,
    payload: { mode: config.mode, clientId: config.clientId },
    timestamp: new Date().toISOString()
  })

  if (config.internalApi.enabled) {
    await createInternalApiServer(app)
  }

  await client.initialize()
  return app
}
