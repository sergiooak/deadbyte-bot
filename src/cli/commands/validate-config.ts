import { validateCommandAliases } from '@deadbyte/runtime'
import { defineCommand } from 'citty'
import { deadbyteBot } from '../../bot/deadbyte.bot.js'
import { loadBotConfig } from '../../config/load-config.js'

export const validateConfigCommand = defineCommand({
  meta: {
    name: 'validate-config',
    description: 'Validate runtime config and command aliases.'
  },
  args: {
    runtimeConfig: { type: 'string', description: 'Runtime config JSON path.' }
  },
  async run({ args }) {
    const config = await loadBotConfig({
      runtimeConfig: args.runtimeConfig
    })
    const collisions = validateCommandAliases(deadbyteBot.commands, config)
    if (collisions.length) {
      process.stderr.write(`${JSON.stringify({ ok: false, collisions }, null, 2)}\n`)
      process.exitCode = 1
      return
    }

    process.stdout.write(`${JSON.stringify({ ok: true, instanceId: config.instanceId, mode: config.mode }, null, 2)}\n`)
  }
})
