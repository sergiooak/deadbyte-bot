import type { CommandContext } from '@deadbyte/runtime'
import type { WhatsappChatLike, WhatsappClientLike } from '../whatsapp/whatsapp-adapter.js'

function participantId(value: { id?: { _serialized?: string; user?: string } }): string {
  return value.id?._serialized ?? value.id?.user ?? ''
}

function normalizeId(value: string | undefined): string {
  return value?.replace(/@.+$/, '') ?? ''
}

function compactStrings(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value))
}

export async function resolveGroupAdminState(
  ctx: CommandContext,
  client: WhatsappClientLike,
  rawChat?: WhatsappChatLike
): Promise<{ isGroup: boolean; isSenderAdmin: boolean; isBotAdmin: boolean; chat?: WhatsappChatLike }> {
  if (!ctx.chat.isGroup) {
    return { isGroup: false, isSenderAdmin: false, isBotAdmin: false, chat: rawChat }
  }

  const chat = rawChat?.participants ? rawChat : await rawChat?.fetch?.()
  const participants = chat?.participants ?? []
  const senderCandidates = new Set(compactStrings([ctx.sender.id, ctx.sender.number, normalizeId(ctx.sender.id)]))
  const botId = client.info?.wid?._serialized
  const botCandidates = new Set(compactStrings([botId, normalizeId(botId)]))

  const isAdmin = (candidates: Set<string>) =>
    participants.some((participant) => {
      const id = participantId(participant)
      return (participant.isAdmin || participant.isSuperAdmin) && (candidates.has(id) || candidates.has(normalizeId(id)))
    })

  return {
    isGroup: true,
    isSenderAdmin: isAdmin(senderCandidates),
    isBotAdmin: isAdmin(botCandidates),
    chat
  }
}
