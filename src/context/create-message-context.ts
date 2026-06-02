import type { MessageContext, ResolvedDeadByteConfig } from '@deadbyte/runtime'
import type { SpintaxService } from '../services/text/spintax.service.js'
import { downloadMessageMedia, bufferMediaToWhatsappMedia } from '../whatsapp/media.mapper.js'
import { mapWhatsappChat, mapWhatsappContact, mapWhatsappMessage } from '../whatsapp/message.mapper.js'
import type { WhatsappClientLike, WhatsappMessageLike, WhatsappMessageSendOptionsLike } from '../whatsapp/whatsapp-adapter.js'
import { parseCommand } from './parse-command.js'
import { resolvePermissions } from './resolve-permissions.js'
import { resolveTargetMessage } from './resolve-target-message.js'

export type CreateMessageContextOptions = {
  client: WhatsappClientLike
  config: ResolvedDeadByteConfig
  services: Record<string, unknown>
  spintax?: SpintaxService
}

function renderSendOptions(
  options: WhatsappMessageSendOptionsLike | undefined,
  spintax: SpintaxService | undefined
): WhatsappMessageSendOptionsLike | undefined {
  if (!options || !spintax || typeof options.caption !== 'string') {
    return options
  }

  return {
    ...options,
    caption: spintax.render(options.caption)
  }
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
  const spintax = options.spintax ?? (options.services.spintax as SpintaxService | undefined)

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
    reply: async (text, replyOptions?: WhatsappMessageSendOptionsLike) => {
      const renderedText = spintax?.render(text) ?? text
      const renderedOptions = renderSendOptions(replyOptions, spintax)
      if (rawMessage.reply) {
        if (!renderedOptions) {
          await rawMessage.reply(renderedText)
          return
        }
        await rawMessage.reply(renderedText, undefined, renderedOptions)
        return
      }
      if (!renderedOptions) {
        await options.client.sendMessage(chat.id, renderedText)
        return
      }
      await options.client.sendMessage(chat.id, renderedText, renderedOptions)
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
