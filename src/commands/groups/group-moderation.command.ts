import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { resolveGroupAdminState } from '../../groups/group-admins.js'
import { collectGroupTargets, participantUser } from '../../groups/group-targets.js'
import { groupMessages } from '../../messages/group.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'
import type { WhatsappChatLike, WhatsappClientLike, WhatsappMessageLike } from '../../whatsapp/whatsapp-adapter.js'

type GroupModerationServices = {
  rawChat?: WhatsappChatLike
  rawMessage?: WhatsappMessageLike
  spintax?: { render(input: string): string }
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

function renderCopy(ctx: CommandContext, text: string): string {
  return servicesOf(ctx).spintax?.render(text) ?? text
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
    await ctx.reply(groupMessages.groupOnly)
    return undefined
  }

  return { chat, client, rawMessage: services.rawMessage }
}

async function requireGroupAdmin(ctx: CommandContext): Promise<GroupAccess | undefined> {
  const services = servicesOf(ctx)
  const client = services.whatsappClient
  if (!client) {
    await ctx.reply(groupMessages.whatsappClientUnavailable)
    return undefined
  }

  const admin = await resolveGroupAdminState(ctx, client, services.rawChat)
  if (!admin.isGroup) {
    await ctx.reply(groupMessages.groupOnly)
    return undefined
  }
  if (!admin.isSenderAdmin) {
    await ctx.reply(groupMessages.senderAdminRequired)
    return undefined
  }
  if (!admin.isBotAdmin) {
    await ctx.reply(groupMessages.botAdminRequired)
    return undefined
  }

  const chat = admin.chat ?? services.rawChat
  if (!chat) {
    await ctx.reply(groupMessages.groupLoadFailed)
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
  await ctx.reply(groupMessages.noTargets)
}

async function sendWithMentions(ctx: CommandContext, chat: WhatsappChatLike, text: string, mentions: string[]): Promise<void> {
  const renderedText = renderCopy(ctx, text)
  if (chat.sendMessage) {
    await chat.sendMessage(renderedText, { mentions })
    return
  }

  await ctx.reply(renderedText)
}

async function setGroupClosed(ctx: CommandContext, adminsOnly: boolean): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const setMessagesAdminsOnly = requireMethod(access.chat, 'setMessagesAdminsOnly')
  if (!setMessagesAdminsOnly) {
    await ctx.reply(groupMessages.messagesAdminsOnlyUnavailable)
    return
  }

  await setMessagesAdminsOnly.call(access.chat, adminsOnly)
  await ctx.reply(adminsOnly ? groupMessages.groupClosed : groupMessages.groupOpened)
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
    await ctx.reply(groupMessages.adminChangeUnavailable)
    return
  }

  await action.call(access.chat, ids)
  await sendWithMentions(ctx, access.chat, groupMessages.adminChanged(mode, ids.map(participantDisplay).join(', ')), ids)
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
    await ctx.reply(groupMessages.noRules)
    return
  }

  await ctx.reply(groupMessages.rules(rules))
}

async function handleMembershipRequests(ctx: CommandContext): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const getRequests = requireMethod(access.chat, 'getGroupMembershipRequests')
  if (!getRequests) {
    await ctx.reply(groupMessages.membershipRequestsUnavailable)
    return
  }

  const requests = await getRequests.call(access.chat)
  const count = Array.isArray(requests) ? requests.length : 0
  const action = argsText(ctx).toLowerCase()

  if (count === 0) {
    await ctx.reply(groupMessages.noMembershipRequests)
    return
  }

  if (/\b(?:aceitar|aprovar|accept|approve|all|todas)\b/.test(action)) {
    const approve = requireMethod(access.chat, 'approveGroupMembershipRequests')
    if (!approve) {
      await ctx.reply(groupMessages.approveRequestsUnavailable)
      return
    }

    await approve.call(access.chat)
    await ctx.reply(groupMessages.approvedRequests(count))
    return
  }

  if (/\b(?:rejeitar|recusar|reject|deny|negar)\b/.test(action)) {
    const reject = requireMethod(access.chat, 'rejectGroupMembershipRequests')
    if (!reject) {
      await ctx.reply(groupMessages.rejectRequestsUnavailable)
      return
    }

    await reject.call(access.chat)
    await ctx.reply(groupMessages.rejectedRequests(count))
    return
  }

  const ids = membershipRequestIds(requests)
  const preview = ids.slice(0, 10).map(participantDisplay).join(', ')
  await sendWithMentions(
    ctx,
    access.chat,
    groupMessages.membershipRequestsPreview(count, preview, ids.length > 10),
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
    await ctx.reply(groupMessages.noGiveawayTargets(adminsOnly))
    return
  }

  const prize = argsText(ctx)
  await sendWithMentions(ctx, access.chat, groupMessages.giveawayWinner(participantDisplay(winnerId), prize), [winnerId])
  await ctx.react(randomItem(groupMessages.giveawayReactions) ?? '🎉')
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
    await ctx.reply(groupMessages.noRouletteCandidate)
    return
  }

  const removeParticipants = requireMethod(access.chat, 'removeParticipants')
  if (!removeParticipants) {
    await ctx.reply(groupMessages.participantRemovalUnavailable)
    return
  }

  await sendWithMentions(ctx, access.chat, groupMessages.rouletteLoser(participantDisplay(unluckyId)), [unluckyId])
  await removeParticipants.call(access.chat, [unluckyId])
}

async function deleteMessageWithReplies(ctx: CommandContext): Promise<void> {
  const access = await requireGroupAdmin(ctx)
  if (!access) return

  const rawMessage = access.rawMessage
  if (!rawMessage?.hasQuotedMsg || !rawMessage.getQuotedMessage) {
    await ctx.reply(groupMessages.deleteReplyRequired)
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

  await ctx.reply(groupMessages.deletedMessages(deleted))
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
      await ctx.reply(groupMessages.participantRemovalUnavailable)
      return
    }

    await removeParticipants.call(access.chat, ids)
    await sendWithMentions(ctx, access.chat, groupMessages.removedParticipants(ids.map(participantDisplay).join(', ')), ids)
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
      await ctx.reply(groupMessages.participantAddUnavailable)
      return
    }

    await addParticipants.call(access.chat, ids)
    await sendWithMentions(ctx, access.chat, groupMessages.addAttempted(ids.map(participantDisplay).join(', ')), ids)
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
      await ctx.reply(groupMessages.noAdmins)
      return
    }

    await sendWithMentions(ctx, access.chat, argsText(ctx) || groupMessages.callAdminsDefault, ids)
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
      await ctx.reply(groupMessages.noParticipantsToMention)
      return
    }

    const text = argsText(ctx) || groupMessages.everyoneDefault
    await sendWithMentions(ctx, access.chat, text, ids)
  }
})
