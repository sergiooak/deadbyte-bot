import type { MessageContext, ResolvedDeadByteConfig } from '@deadbyte/runtime'
import { downloadMessageMedia, bufferMediaToWhatsappMedia } from '../whatsapp/media.mapper.js'
import { mapWhatsappChat, mapWhatsappContact, mapWhatsappMessage } from '../whatsapp/message.mapper.js'
import type { WhatsappClientLike, WhatsappMessageLike } from '../whatsapp/whatsapp-adapter.js'
import { parseCommand } from './parse-command.js'
import { resolvePermissions } from './resolve-permissions.js'
import { resolveTargetMessage } from './resolve-target-message.js'

export type CreateMessageContextOptions = {
  client: WhatsappClientLike
  config: ResolvedDeadByteConfig
  services: Record<string, unknown>
}

export async function createMessageContext(
  rawMessage: WhatsappMessageLike,
  options: CreateMessageContextOptions
): Promise<MessageContext> {
  const rawChat = rawMessage.getChat ? await rawMessage.getChat() : { id: { _serialized: rawMessage.from }, isGroup: false }
  const rawSender = rawMessage.getContact ? await rawMessage.getContact() : { id: { _serialized: rawMessage.author ?? rawMessage.from } }
  const message = mapWhatsappMessage(rawMessage)
  const chat = mapWhatsappChat(rawChat, rawMessage.from)
  const sender = mapWhatsappContact(rawSender, rawMessage.author ?? rawMessage.from)
  const target = await resolveTargetMessage(rawMessage)
  const parsedCommand = parseCommand(message.body, options.config.prefixes, options.config.fallbackPrefixes, {
    botId: options.client.info?.wid?._serialized
  })
  const permissions = resolvePermissions(options.config, chat, sender)

  return {
    message,
    chat,
    sender,
    quotedMessage: target.quotedMessage,
    targetMessage: target.targetMessage,
    parsedCommand,
    permissions,
    config: options.config,
    services: {
      ...options.services,
      resolveTargetMedia: () => downloadMessageMedia(target.rawTargetMessage),
      replyWithMedia: async (bufMedia: { buffer: Buffer; mimeType: string; filename?: string }) => {
        const media = bufferMediaToWhatsappMedia(bufMedia)
        await options.client.sendMessage(chat.id, media)
      }
    },
    reply: async (text) => {
      if (rawMessage.reply) {
        await rawMessage.reply(text)
        return
      }
      await options.client.sendMessage(chat.id, text)
    },
    replyWithSticker: async (sticker, mimeType = 'image/webp') => {
      const media = bufferMediaToWhatsappMedia({ buffer: sticker, mimeType, filename: 'sticker.webp' })
      await options.client.sendMessage(chat.id, media, { sendMediaAsSticker: true })
    },
    react: async (emoji) => {
      await rawMessage.react?.(emoji)
    }
  }
}
