import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { matchesCommandAlias } from '../../utils/commands.js'
import { resolveGroupAdminState } from '../../groups/group-admins.js'
import { GROUP_CONFIG_BOOLEAN_KEYS, GROUP_CONFIG_STRING_KEYS, type GroupConfig, type GroupConfigBooleanKey, type GroupConfigStringKey } from '../../groups/group-config.types.js'
import type { GroupConfigService } from '../../groups/group-config.service.js'
import type { WhatsappChatLike, WhatsappClientLike } from '../../whatsapp/whatsapp-adapter.js'

type GroupConfigCommandServices = {
  groupConfigs?: GroupConfigService
  rawChat?: WhatsappChatLike
  whatsappClient?: WhatsappClientLike
}

const BOOLEAN_SET = new Set<string>(GROUP_CONFIG_BOOLEAN_KEYS)
const STRING_SET = new Set<string>(GROUP_CONFIG_STRING_KEYS)

function servicesOf(ctx: CommandContext): GroupConfigCommandServices {
  return ctx.services as GroupConfigCommandServices
}

async function requireGroupAdmin(ctx: CommandContext): Promise<{ ok: boolean; service?: GroupConfigService; chat?: WhatsappChatLike }> {
  const services = servicesOf(ctx)
  const client = services.whatsappClient
  const service = services.groupConfigs
  if (!client || !service) {
    await ctx.reply('Configuração de grupos indisponível neste runtime.')
    return { ok: false }
  }

  const admin = await resolveGroupAdminState(ctx, client, services.rawChat)
  if (!admin.isGroup) {
    await ctx.reply('Este comando só funciona em grupos.')
    return { ok: false }
  }
  if (!admin.isSenderAdmin) {
    return { ok: false }
  }
  if (!admin.isBotAdmin) {
    await ctx.reply('Preciso ser admin do grupo para atualizar a descrição e salvar a configuração.')
    return { ok: false }
  }

  return { ok: true, service, chat: admin.chat ?? services.rawChat }
}

function describeConfig(config: GroupConfig): string {
  const enabled = GROUP_CONFIG_BOOLEAN_KEYS.filter((key) => config[key])
  const disabled = GROUP_CONFIG_BOOLEAN_KEYS.filter((key) => !config[key])
  const strings = GROUP_CONFIG_STRING_KEYS.map((key) => `*${key}:* ${config[key] ?? '(padrão global)'}`)

  return [
    '*Configuração do grupo*',
    '',
    `Ativos: ${enabled.length ? enabled.map((key) => `*${key}*`).join(', ') : 'nenhum'}`,
    `Desligados: ${disabled.map((key) => `*${key}*`).join(', ')}`,
    ...strings,
    '',
    'Use !on welcome, !off welcome, !set autor Sergio ou !set pacote DeadByte.'
  ].join('\n')
}

function splitArgs(ctx: CommandContext): string[] {
  return ctx.parsedCommand?.argsText.trim().split(/\s+/).filter(Boolean) ?? []
}

async function updateConfig(ctx: CommandContext, mutate: (config: GroupConfig) => GroupConfig | undefined): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access.ok || !access.service || !access.chat) return

  const current = await access.service.ensureLoaded(access.chat)
  const next = mutate({ ...current })
  if (!next) return

  await access.service.updateDescription(access.chat, next)
  await ctx.reply('Configuração do grupo atualizada na descrição.')
}

export const showGroupConfigCommand = defineCommand({
  id: 'group.config',
  group: 'group',
  name: 'Configuração do grupo',
  description: 'Lista as opções ativas da configuração visível na descrição do grupo.',
  aliases: ['config'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: false,
    groups: true,
    implicit: false
  },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.config', showGroupConfigCommand.aliases)
  },
  async run(ctx) {
    const services = servicesOf(ctx)
    const chat = services.rawChat
    if (!ctx.chat.isGroup || !chat || !services.groupConfigs) {
      await ctx.reply('Este comando só funciona em grupos.')
      return
    }

    const config = await services.groupConfigs.ensureLoaded(chat)
    await ctx.reply(describeConfig(config))
  }
})

export const enableGroupConfigCommand = defineCommand({
  id: 'group.config-on',
  group: 'group',
  name: 'Ligar configuração do grupo',
  description: 'Liga uma opção booleana da configuração do grupo.',
  aliases: ['on'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: false,
    groups: true,
    implicit: false
  },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.config-on', enableGroupConfigCommand.aliases)
  },
  async run(ctx) {
    const key = splitArgs(ctx)[0] as GroupConfigBooleanKey | undefined
    if (!key || !BOOLEAN_SET.has(key)) {
      await ctx.reply(`Opção booleana inválida. Use: ${GROUP_CONFIG_BOOLEAN_KEYS.join(', ')}.`)
      return
    }

    await updateConfig(ctx, (config) => {
      config[key] = true
      return config
    })
  }
})

export const disableGroupConfigCommand = defineCommand({
  id: 'group.config-off',
  group: 'group',
  name: 'Desligar configuração do grupo',
  description: 'Desliga uma opção booleana da configuração do grupo.',
  aliases: ['off'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: false,
    groups: true,
    implicit: false
  },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.config-off', disableGroupConfigCommand.aliases)
  },
  async run(ctx) {
    const key = splitArgs(ctx)[0] as GroupConfigBooleanKey | undefined
    if (!key || !BOOLEAN_SET.has(key)) {
      await ctx.reply(`Opção booleana inválida. Use: ${GROUP_CONFIG_BOOLEAN_KEYS.join(', ')}.`)
      return
    }

    await updateConfig(ctx, (config) => {
      config[key] = false
      return config
    })
  }
})

export const setGroupConfigCommand = defineCommand({
  id: 'group.config-set',
  group: 'group',
  name: 'Definir configuração do grupo',
  description: 'Define uma opção textual da configuração do grupo.',
  aliases: ['set'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: false,
    groups: true,
    implicit: false
  },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.config-set', setGroupConfigCommand.aliases)
  },
  async run(ctx) {
    const [rawKey, ...valueParts] = splitArgs(ctx)
    const key = rawKey as GroupConfigStringKey | undefined
    if (!key || !STRING_SET.has(key)) {
      await ctx.reply(`Opção textual inválida. Use: ${GROUP_CONFIG_STRING_KEYS.join(', ')}.`)
      return
    }

    await updateConfig(ctx, (config) => {
      config[key] = valueParts.join(' ')
      return config
    })
  }
})
