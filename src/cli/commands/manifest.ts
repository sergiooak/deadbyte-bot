import { createBotManifest } from '@deadbyte/runtime'
import { defineCommand } from 'citty'
import { deadbyteBot } from '../../bot/deadbyte.bot.js'

export const manifestCommand = defineCommand({
  meta: {
    name: 'manifest',
    description: 'Print the serializable bot manifest.'
  },
  run() {
    process.stdout.write(`${JSON.stringify(createBotManifest(deadbyteBot), null, 2)}\n`)
  }
})
