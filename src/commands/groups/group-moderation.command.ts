import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { resolveGroupAdminState } from '../../groups/group-admins.js'
import { collectGroupTargets, participantUser } from '../../groups/group-targets.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import type { WhatsappChatLike, WhatsappClientLike, WhatsappMessageLike } from '../../whatsapp/whatsapp-adapter.js'

type GroupModerationServices = {
  rawChat?: WhatsappChatLike
  rawMessage?: WhatsappMessageLike
  whatsappClient?: WhatsappClientLike
}

type GroupAccess = {
  chat: WhatsappChatLike
  client: WhatsappClientLike
  rawMessage?: WhatsappMessageLike
}

function servicesOf(ctx: CommandContext): GroupModerationServices {
  return ctx.services as GroupModerationServices
}

function idOf(value: { id?: { _serialized?: string; user?: string } } | undefined): string {
  return value?.id?._serialized ?? value?.id?.user ?? ''
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function argsText(ctx: CommandContext): string {
  return ctx.parsedCommand?.argsText.trim() ?? ''
}

async function requireGroup(ctx: CommandContext): Promise<GroupAccess | undefined> {
  const services = servicesOf(ctx)
  const client = services.whatsappClient
  const chat = services.rawChat
  if (!client || !chat || !ctx.chat.isGroup) {
    await ctx.reply('Este comando so funciona em grupos.')
    return undefined
  }

  return { chat, client, rawMessage: services.rawMessage }
}

async function requireGroupAdmin(ctx: CommandContext): Promise<GroupAccess | undefined> {
  const services = servicesOf(ctx)
  const client = services.whatsappClient
  if (!client) {
    await ctx.reply('Cliente do WhatsApp indisponivel neste runtime.')
    return undefined
  }

  const admin = await resolveGroupAdminState(ctx, client, services.rawChat)
  if (!admin.isGroup) {
    await ctx.reply('Este comando so funciona em grupos.')
    return undefined
  }
  if (!admin.isSenderAdmin) {
    await ctx.reply('Apenas admins do grupo podem usar este comando.')
    return undefined
  }
  if (!admin.isBotAdmin) {
    await ctx.reply('Preciso ser admin do grupo para executar esta acao.')
    return undefined
  }

  const chat = admin.chat ?? services.rawChat
  if (!chat) {
    await ctx.reply('Nao consegui carregar os dados do grupo.')
    return undefined
  }

  return { chat, client, rawMessage: services.rawMessage }
}

async function resolveTargetIds(ctx: CommandContext, rawMessage?: WhatsappMessageLike): Promise<string[]> {
  const targets = await collectGroupTargets(ctx, argsText(ctx), rawMessage)
  return targets.map((target) => target.id)
}

function participantDisplay(id: string): string {
  return `@${participantUser(id)}`
}

function requireMethod<T extends keyof WhatsappChatLike>(chat: WhatsappChatLike, method: T): WhatsappChatLike[T] | undefined {
  return typeof chat[method] === 'function' ? chat[method] : undefined
}

async function replyNoTargets(ctx: CommandContext): Promise<void> {
  await ctx.reply('Marque alguem, responda uma mensagem ou informe o numero com DDI.')
}

async function sendWithMentions(ctx: CommandContext, chat: WhatsappChatLike, text: string, mentions: string[]): Promise<void> {
  if (chat.sendMessage) {
    await chat.sendMessage(text, { mentions })
    return
  }

  await ctx.reply(text)
}

async function setGroupClosed(ctx: CommandContext, adminsOnly: boolean): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const setMessagesAdminsOnly = requireMethod(access.chat, 'setMessagesAdminsOnly')
  if (!setMessagesAdminsOnly) {
    await ctx.reply('Este runtime nao expoe a alteracao de mensagens apenas para admins.')
    return
  }

  await setMessagesAdminsOnly.call(access.chat, adminsOnly)
  await ctx.reply(adminsOnly ? 'Grupo fechado. Agora apenas admins podem enviar mensagens.' : 'Grupo aberto. Todos podem enviar mensagens.')
}

async function changeAdmin(ctx: CommandContext, mode: 'promote' | 'demote'): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const ids = await resolveTargetIds(ctx, access.rawMessage)
  if (ids.length === 0) {
    await replyNoTargets(ctx)
    return
  }

  const method = mode === 'promote' ? 'promoteParticipants' : 'demoteParticipants'
  const action = requireMethod(access.chat, method)
  if (!action) {
    await ctx.reply('Este runtime nao expoe a alteracao de admins do grupo.')
    return
  }

  await action.call(access.chat, ids)
  await sendWithMentions(ctx, access.chat, `${mode === 'promote' ? 'Admin concedido' : 'Admin removido'}: ${ids.map(participantDisplay).join(', ')}`, ids)
}

function randomItem<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)]
}

function groupParticipants(chat: WhatsappChatLike): Array<{ id?: { _serialized?: string; user?: string }; isAdmin?: boolean; isSuperAdmin?: boolean }> {
  return chat.participants ?? []
}

async function getLoadedGroupChat(chat: WhatsappChatLike): Promise<WhatsappChatLike> {
  return chat.participants ? chat : (await chat.fetch?.()) ?? chat
}

function botId(client: WhatsappClientLike): string {
  return client.info?.wid?._serialized ?? ''
}

function groupDescription(chat: WhatsappChatLike): string {
  return (chat.description ?? '').split('\n').filter((line) => !line.trim().startsWith('#db')).join('\n').trim()
}

function requestId(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const candidate = value as { _serialized?: string; user?: string }
    return candidate._serialized ?? candidate.user ?? ''
  }

  return ''
}

function membershipRequestIds(requests: Array<{ id?: unknown; requesterId?: unknown; participantId?: unknown }>): string[] {
  return unique(requests.map((request) => requestId(request.requesterId) || requestId(request.participantId) || requestId(request.id)))
}

async function showRules(ctx: CommandContext): Promise<void> {
  const access = await requireGroup(ctx)
  if (!access) return

  const chat = await getLoadedGroupChat(access.chat)
  const rules = groupDescription(chat)
  if (!rules) {
    await ctx.reply('Este grupo ainda nao tem regras na descricao.')
    return
  }

  await ctx.reply(`*Regras do grupo*\n\n${rules}`)
}

async function handleMembershipRequests(ctx: CommandContext): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const getRequests = requireMethod(access.chat, 'getGroupMembershipRequests')
  if (!getRequests) {
    await ctx.reply('Este runtime nao expoe as solicitacoes de entrada do grupo.')
    return
  }

  const requests = await getRequests.call(access.chat)
  const count = Array.isArray(requests) ? requests.length : 0
  const action = argsText(ctx).toLowerCase()

  if (count === 0) {
    await ctx.reply('Nao ha solicitacoes de entrada no grupo.')
    return
  }

  if (/\b(?:aceitar|aprovar|accept|approve|all|todas)\b/.test(action)) {
    const approve = requireMethod(access.chat, 'approveGroupMembershipRequests')
    if (!approve) {
      await ctx.reply('Este runtime nao expoe a aprovacao de solicitacoes.')
      return
    }

    await approve.call(access.chat)
    await ctx.reply(`Aprovei ${count} solicitacao(oes) de entrada.`)
    return
  }

  if (/\b(?:rejeitar|recusar|reject|deny|negar)\b/.test(action)) {
    const reject = requireMethod(access.chat, 'rejectGroupMembershipRequests')
    if (!reject) {
      await ctx.reply('Este runtime nao expoe a rejeicao de solicitacoes.')
      return
    }

    await reject.call(access.chat)
    await ctx.reply(`Rejeitei ${count} solicitacao(oes) de entrada.`)
    return
  }

  const ids = membershipRequestIds(requests)
  const preview = ids.slice(0, 10).map(participantDisplay).join(', ')
  await sendWithMentions(
    ctx,
    access.chat,
    preview
      ? `Ha ${count} solicitacao(oes) de entrada: ${preview}${ids.length > 10 ? '...' : ''}\n\nUse *solicitacoes aceitar* ou *solicitacoes rejeitar*.`
      : `Ha ${count} solicitacao(oes) de entrada.\n\nUse *solicitacoes aceitar* ou *solicitacoes rejeitar*.`,
    ids
  )
}

async function giveaway(ctx: CommandContext, adminsOnly: boolean): Promise<void> {
  const access = await requireGroup(ctx)
  if (!access) return

  const chat = await getLoadedGroupChat(access.chat)
  const participants = groupParticipants(chat)
    .filter((participant) => idOf(participant) !== botId(access.client))
    .filter((participant) => !adminsOnly || participant.isAdmin || participant.isSuperAdmin)

  const winner = randomItem(participants)
  const winnerId = idOf(winner)
  if (!winnerId) {
    await ctx.reply(adminsOnly ? 'Nao encontrei admins para sortear.' : 'Nao encontrei participantes para sortear.')
    return
  }

  const prize = argsText(ctx)
  const message = prize
    ? `${participantDisplay(winnerId)} parabens! Voce ganhou o sorteio de *${prize}*!`
    : `${participantDisplay(winnerId)} parabens! Voce ganhou o sorteio!`

  await sendWithMentions(ctx, access.chat, message, [winnerId])
  await ctx.react('🎉')
}

async function russianRoulette(ctx: CommandContext): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const chat = await getLoadedGroupChat(access.chat)
  const candidates = groupParticipants(chat)
    .filter((participant) => idOf(participant) !== botId(access.client))
    .filter((participant) => !participant.isAdmin && !participant.isSuperAdmin)

  const unlucky = randomItem(candidates)
  const unluckyId = idOf(unlucky)
  if (!unluckyId) {
    await ctx.reply('Nao encontrei participante comum para a roleta.')
    return
  }

  const removeParticipants = requireMethod(access.chat, 'removeParticipants')
  if (!removeParticipants) {
    await ctx.reply('Este runtime nao expoe a remocao de participantes.')
    return
  }

  await sendWithMentions(ctx, access.chat, `Roleta russa: ${participantDisplay(unluckyId)} perdeu.`, [unluckyId])
  await removeParticipants.call(access.chat, [unluckyId])
}

async function deleteMessageWithReplies(ctx: CommandContext): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const rawMessage = access.rawMessage
  if (!rawMessage?.hasQuotedMsg || !rawMessage.getQuotedMessage) {
    await ctx.reply('Responda a mensagem que devo apagar.')
    return
  }

  const target = await rawMessage.getQuotedMessage()
  const targetId = idOf(target)
  let deleted = 0

  const recent = access.chat.fetchMessages ? await access.chat.fetchMessages({ limit: 80 }) : []
  for (const message of recent) {
    if (!message.hasQuotedMsg || !message.getQuotedMessage || !message.delete) continue
    try {
      const quoted = await message.getQuotedMessage()
      if (idOf(quoted) === targetId) {
        await message.delete(true)
        deleted += 1
      }
    } catch {
      // Algumas mensagens antigas ou removidas nao permitem carregar a citacao.
    }
  }

  if (target.delete) {
    await target.delete(true)
    deleted += 1
  }

  await ctx.reply(`Pronto. Apaguei ${deleted} mensagem(ns), incluindo replies recentes quando foi possivel.`)
}

export const closeGroupCommand = defineCommand({
  id: 'group.close',
  group: 'group',
  name: 'Fechar grupo',
  description: 'Permite apenas admins enviarem mensagens no grupo.',
  aliases: ['fechar', 'close'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.close', closeGroupCommand.aliases)
  },
  async run(ctx) {
    await setGroupClosed(ctx, true)
  }
})

export const openGroupCommand = defineCommand({
  id: 'group.open',
  group: 'group',
  name: 'Abrir grupo',
  description: 'Permite todos enviarem mensagens no grupo.',
  aliases: ['abrir', 'open'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.open', openGroupCommand.aliases)
  },
  async run(ctx) {
    await setGroupClosed(ctx, false)
  }
})

export const promoteCommand = defineCommand({
  id: 'group.promote',
  group: 'group',
  name: 'Promover admin',
  description: 'Promove participantes a admin por reply, mencao ou numero.',
  aliases: ['promover', 'promote', 'promove'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.promote', promoteCommand.aliases)
  },
  async run(ctx) {
    await changeAdmin(ctx, 'promote')
  }
})

export const demoteCommand = defineCommand({
  id: 'group.demote',
  group: 'group',
  name: 'Rebaixar admin',
  description: 'Remove admin por reply, mencao ou numero.',
  aliases: ['rebaixar', 'demote', 'rebaixa'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.demote', demoteCommand.aliases)
  },
  async run(ctx) {
    await changeAdmin(ctx, 'demote')
  }
})

export const banCommand = defineCommand({
  id: 'group.ban',
  group: 'group',
  name: 'Banir participante',
  description: 'Remove pessoas do grupo por reply, mencao ou numero.',
  aliases: ['ban', 'banir', 'kick', 'remover'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.ban', banCommand.aliases)
  },
  async run(ctx) {
    const access = await requireGroupAdmin(ctx)
    if (!access) return

    const ids = await resolveTargetIds(ctx, access.rawMessage)
    if (ids.length === 0) {
      await replyNoTargets(ctx)
      return
    }

    const removeParticipants = requireMethod(access.chat, 'removeParticipants')
    if (!removeParticipants) {
      await ctx.reply('Este runtime nao expoe a remocao de participantes.')
      return
    }

    await removeParticipants.call(access.chat, ids)
    await sendWithMentions(ctx, access.chat, `Removido(s): ${ids.map(participantDisplay).join(', ')}`, ids)
  }
})

export const addParticipantCommand = defineCommand({
  id: 'group.add',
  group: 'group',
  name: 'Adicionar participante',
  description: 'Tenta adicionar pessoas ao grupo por mencao ou numero.',
  aliases: ['adicionar', 'add'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.add', addParticipantCommand.aliases)
  },
  async run(ctx) {
    const access = await requireGroupAdmin(ctx)
    if (!access) return

    const ids = await resolveTargetIds(ctx, access.rawMessage)
    if (ids.length === 0) {
      await replyNoTargets(ctx)
      return
    }

    const addParticipants = requireMethod(access.chat, 'addParticipants')
    if (!addParticipants) {
      await ctx.reply('Este runtime nao expoe a adicao de participantes.')
      return
    }

    await addParticipants.call(access.chat, ids)
    await sendWithMentions(ctx, access.chat, `Tentei adicionar: ${ids.map(participantDisplay).join(', ')}`, ids)
  }
})

export const deleteGroupMessageCommand = defineCommand({
  id: 'group.delete',
  group: 'group',
  name: 'Deletar mensagem',
  description: 'Apaga a mensagem respondida e replies recentes quando possivel.',
  aliases: ['deletar', 'delete', 'apagar'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.delete', deleteGroupMessageCommand.aliases)
  },
  async run(ctx) {
    await deleteMessageWithReplies(ctx)
  }
})

export const callAdminsCommand = defineCommand({
  id: 'group.call-admins',
  group: 'group',
  name: 'Chamar admins',
  description: 'Marca todos os admins do grupo.',
  aliases: ['adm', 'admins', 'adms'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.call-admins', callAdminsCommand.aliases)
  },
  async run(ctx) {
    const access = await requireGroup(ctx)
    if (!access) return

    const chat = access.chat.participants ? access.chat : await access.chat.fetch?.()
    const ids = unique((chat?.participants ?? [])
      .filter((participant) => participant.isAdmin || participant.isSuperAdmin)
      .map((participant) => idOf(participant)))

    if (ids.length === 0) {
      await ctx.reply('Nao encontrei admins na lista de participantes.')
      return
    }

    await sendWithMentions(ctx, access.chat, argsText(ctx) || 'Chamando admins.', ids)
  }
})

export const giveawayCommand = defineCommand({
  id: 'group.giveaway',
  group: 'group',
  name: 'Sorteio',
  description: 'Sorteia um participante do grupo.',
  aliases: ['sorteio', 'sortear'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.giveaway', giveawayCommand.aliases)
  },
  async run(ctx) {
    await giveaway(ctx, false)
  }
})

export const giveawayAdminsCommand = defineCommand({
  id: 'group.giveaway-admins',
  group: 'group',
  name: 'Sorteio de admins',
  description: 'Sorteia um admin do grupo.',
  aliases: ['sorteioadm', 'sortearadm'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.giveaway-admins', giveawayAdminsCommand.aliases)
  },
  async run(ctx) {
    await giveaway(ctx, true)
  }
})

export const russianRouletteCommand = defineCommand({
  id: 'group.russian-roulette',
  group: 'group',
  name: 'Roleta russa',
  description: 'Remove aleatoriamente um participante comum do grupo.',
  aliases: ['roleta', 'roletarussa', 'russianroulette'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.russian-roulette', russianRouletteCommand.aliases)
  },
  async run(ctx) {
    await russianRoulette(ctx)
  }
})

export const rulesCommand = defineCommand({
  id: 'group.rules',
  group: 'group',
  name: 'Regras',
  description: 'Mostra as regras do grupo a partir da descricao.',
  aliases: ['regras', 'rules'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.rules', rulesCommand.aliases)
  },
  async run(ctx) {
    await showRules(ctx)
  }
})

export const membershipRequestsCommand = defineCommand({
  id: 'group.membership-requests',
  group: 'group',
  name: 'Solicitacoes',
  description: 'Lista, aprova ou rejeita solicitacoes de entrada do grupo.',
  aliases: ['solicitacoes', 'solicitacao', 'pedidos', 'requests'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.membership-requests', membershipRequestsCommand.aliases)
  },
  async run(ctx) {
    await handleMembershipRequests(ctx)
  }
})

export const everyoneCommand = defineCommand({
  id: 'group.everyone',
  group: 'group',
  name: 'Marcar todos',
  description: 'Reenvia uma mensagem marcando todos os participantes do grupo.',
  aliases: ['todos', 'all'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: { private: false, groups: true, implicit: false },
  configFields: [],
  match(ctx) {
    return matchesCommandAlias(ctx, 'group.everyone', everyoneCommand.aliases)
  },
  async run(ctx) {
    const access = await requireGroupAdmin(ctx)
    if (!access) return

    const chat = access.chat.participants ? access.chat : await access.chat.fetch?.()
    const ids = unique((chat?.participants ?? []).map((participant) => idOf(participant)))
    if (ids.length === 0) {
      await ctx.reply('Nao encontrei participantes para marcar.')
      return
    }

    const text = argsText(ctx) || '@todos'
    await sendWithMentions(ctx, access.chat, text, ids)
  }
})
