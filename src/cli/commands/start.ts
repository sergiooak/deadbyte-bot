import type { RuntimeMode } from '@deadbyte/runtime'
import { defineCommand } from 'citty'
import { loadBotConfig } from '../../config/load-config.js'
import { startBot } from '../../app/start-bot.js'

export const startCommand = defineCommand({
  meta: {
    name: 'start',
    description: 'Start the DeadByte bot.'
  },
  args: {
    mode: { type: 'string', description: 'standalone or managed' },
    instanceId: { type: 'string', description: 'Instance id.' },
    clientId: { type: 'string', description: 'WhatsApp LocalAuth client id.' },
    sessionPath: { type: 'string', description: 'LocalAuth data path.' },
    runtimeConfig: { type: 'string', description: 'Runtime config JSON path.' },
    internalApi: { type: 'boolean', description: 'Enable internal API.' },
    internalHost: { type: 'string', description: 'Internal API host.' },
    internalPort: { type: 'string', description: 'Internal API port.' },
    showBrowser: { type: 'boolean', description: 'Show Chromium window.' },
    headless: { type: 'boolean', description: 'Run Chromium headless.' }
  },
  async run({ args }) {
    const config = await loadBotConfig({
      mode: args.mode as RuntimeMode | undefined,
      instanceId: args.instanceId,
      clientId: args.clientId,
      sessionPath: args.sessionPath,
      runtimeConfig: args.runtimeConfig,
      internalApi: args.internalApi,
      internalHost: args.internalHost,
      internalPort: args.internalPort ? Number(args.internalPort) : undefined,
      showBrowser: args.showBrowser,
      headless: args.headless
    })

    const app = await startBot(config)
    const shutdown = async () => {
      await app.shutdown()
      process.exit(0)
    }
    process.once('SIGINT', () => void shutdown())
    process.once('SIGTERM', () => void shutdown())
  }
})
