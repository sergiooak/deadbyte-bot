import type { RuntimeMode } from '@deadbyte/runtime'
import { defineCommand } from 'citty'
import { loadBotConfig } from '../../config/load-config.js'
import { startBot } from '../../app/start-bot.js'
import { flushBotLogs } from '../../logging/evlog.js'
import { normalizePairingPhone } from '../../whatsapp/pairing.js'

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
    headless: { type: 'boolean', description: 'Run Chromium headless.' },
    pairPhone: { type: 'string', description: 'Pair by phone number (DDI + DDD + number) instead of QR.' }
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

    const pairPhone = args.pairPhone ? normalizePairingPhone(args.pairPhone) : undefined
    if (args.pairPhone && !pairPhone) {
      throw new Error('--pair-phone precisa ter DDI + DDD + número, só dígitos (ex.: 5534999999999).')
    }

    const app = await startBot(config, { pairPhone })
    const shutdown = async () => {
      await app.shutdown()
      await flushBotLogs()
      process.exit(0)
    }
    process.once('SIGINT', () => void shutdown())
    process.once('SIGTERM', () => void shutdown())
  }
})
