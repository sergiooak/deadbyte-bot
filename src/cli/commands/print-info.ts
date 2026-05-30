import { defineCommand } from 'citty'
import { loadBotConfig } from '../../config/load-config.js'

export const printInfoCommand = defineCommand({
  meta: {
    name: 'print-info',
    description: 'Print resolved runtime information.'
  },
  async run() {
    const config = await loadBotConfig()
    process.stdout.write(
      `${JSON.stringify(
        {
          name: 'DeadByte',
          version: '4.0.0',
          instanceId: config.instanceId,
          clientId: config.clientId,
          mode: config.mode,
          internalApi: config.internalApi
        },
        null,
        2
      )}\n`
    )
  }
})
