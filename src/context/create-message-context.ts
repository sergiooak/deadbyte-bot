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

function onlyDigits(value: string | undefined): string {
  return value?.replace(/\D/g, '') ?? ''
}

function contactId(contact: { id?: { _serialized?: string; user?: string } }): string {
  return contact.id?._serialized ?? contact.id?.user ?? ''
}

function contactUserId(contact: { id?: { _serialized?: string; user?: string } }): string {
  const id = contactId(contact)
  return contact.id?.user ?? id.replace(/@.+$/, '')
}

async function resolveContactPhoneMap(
  client: WhatsappClientLike,
  contacts: Array<{ id?: { _serialized?: string; user?: string } }>
): Promise<Map<string, string>> {
  if (!client.getContactLidAndPhone) return new Map()

  const ids = [...new Set(contacts.map(contactId).filter((id) => id.includes('@lid')))]
  if (ids.length === 0) return new Map()

  const pairs = await client.getContactLidAndPhone(ids)
  const entries: Array<[string, string]> = pairs.flatMap((pair) => {
    const phone = onlyDigits(pair.pn)
    if (!phone) return []

    const lid = pair.lid.includes('@') ? pair.lid : `${pair.lid}@lid`
    return [
      [pair.lid, phone] as [string, string],
      [lid, phone] as [string, string]
    ]
  })

  return new Map(entries)
}

function mapContactWithResolvedPhone(
  contact: { id?: { _serialized?: string; user?: string }; number?: string; name?: string; pushname?: string; isMe?: boolean; isMyContact?: boolean },
  fallbackId: string,
  phoneByLid: Map<string, string>
) {
  const id = contactId(contact)
  const directPhone = id.endsWith('@c.us') ? onlyDigits(contactUserId(contact)) : ''
  const resolvedPhone = phoneByLid.get(id)
  const contactNumber = onlyDigits(contact.number)

  return mapWhatsappContact(
    {
      ...contact,
      number: directPhone || resolvedPhone || contactNumber || undefined
    },
    fallbackId
  )
}

export async function createMessageContext(
  rawMessage: WhatsappMessageLike,
  options: CreateMessageContextOptions
): Promise<MessageContext> {
  const rawChat = rawMessage.getChat ? await rawMessage.getChat() : { id: { _serialized: rawMessage.from }, isGroup: false }
  const rawSender = rawMessage.getContact ? await rawMessage.getContact() : { id: { _serialized: rawMessage.author ?? rawMessage.from } }
  const senderPhoneByLid = await resolveContactPhoneMap(options.client, [rawSender])
  const message = mapWhatsappMessage(rawMessage)
  const chat = mapWhatsappChat(rawChat, rawMessage.from)
  const sender = mapContactWithResolvedPhone(rawSender, rawMessage.author ?? rawMessage.from, senderPhoneByLid)
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
      rawMessage,
      rawChat,
      whatsappClient: options.client,
      resolveTargetMedia: () => downloadMessageMedia(target.rawTargetMessage),
      resolveTargetContact: async () => {
        const rawContact = target.rawTargetMessage.getContact
          ? await target.rawTargetMessage.getContact()
          : { id: { _serialized: target.rawTargetMessage.author ?? target.rawTargetMessage.from } }
        const phoneByLid = await resolveContactPhoneMap(options.client, [rawContact])

        return mapContactWithResolvedPhone(rawContact, target.rawTargetMessage.author ?? target.rawTargetMessage.from, phoneByLid)
      },
      resolveMentionedContacts: async () => {
        if (rawMessage.getMentions) {
          const rawMentions = await rawMessage.getMentions()
          const phoneByLid = await resolveContactPhoneMap(options.client, rawMentions)
          return rawMentions.map((contact) => mapContactWithResolvedPhone(contact, contact.id?._serialized ?? contact.id?.user ?? contact.number ?? '', phoneByLid))
        }

        return (message.mentionedIds ?? []).map((id) => mapWhatsappContact({ id: { _serialized: id } }, id))
      },
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
