import { defineCommand, runMain } from 'citty'
import { manifestCommand } from './commands/manifest.js'
import { printInfoCommand } from './commands/print-info.js'
import { startCommand } from './commands/start.js'
import { validateConfigCommand } from './commands/validate-config.js'

const main = defineCommand({
  meta: {
    name: 'deadbyte-bot',
    description: 'DeadByte v4 bot CLI'
  },
  subCommands: {
    start: startCommand,
    manifest: manifestCommand,
    'validate-config': validateConfigCommand,
    'print-info': printInfoCommand
  }
})

await runMain(main)
