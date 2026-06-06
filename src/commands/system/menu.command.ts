import { defineCommand, type DeadByteCommand } from '@deadbyte/runtime'
import { matchesCommandAlias } from '../../utils/commands.js'
import { createSystemMenu } from './menu.helper.js'

type MenuServices = {
  commands?: DeadByteCommand[]
}

type CommandConfig = Record<string, { aliases?: string[]; enabled?: boolean } | undefined>

export const menuCommand = defineCommand({
  id: 'system.menu',
  group: 'system',
  name: 'Menu',
  description: 'Lista todos os comandos disponíveis do bot.',
  aliases: ['menu', 'ajuda', 'help', 'comandos'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'system.menu', menuCommand.aliases)
  },
  async run(ctx) {
    const services = ctx.services as MenuServices
    const allCommands = services.commands ?? []
    const prefix = ctx.config.prefixes[0] ?? '.'
    await ctx.reply(createSystemMenu(allCommands, prefix, ctx.config.commands as CommandConfig))
  }
})
