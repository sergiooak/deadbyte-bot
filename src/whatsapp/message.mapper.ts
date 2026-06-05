import type { DeadByteChat, DeadByteContact, DeadByteMessage } from '@deadbyte/runtime'
import type { WhatsappChatLike, WhatsappContactLike, WhatsappMessageLike } from './whatsapp-adapter.js'

export function serializedId(value: { _serialized?: string; user?: string } | undefined, fallback = ''): string {
  return value?._serialized ?? value?.user ?? fallback
}

export function normalizeWhatsappMentionIds(mentionedIds: WhatsappMessageLike['mentionedIds']): string[] {
  return (mentionedIds ?? []).flatMap((mention) => {
    if (typeof mention === 'string') return mention ? [mention] : []

    const id = serializedId(mention)
    return id ? [id] : []
  })
}

export function mapWhatsappMessage(message: WhatsappMessageLike): DeadByteMessage {
  return {
    id: serializedId(message.id, `${message.from}:${message.timestamp ?? Date.now()}`),
    from: message.from,
    to: message.to,
    author: message.author,
    body: message.body ?? '',
    type: message.type,
    timestamp: message.timestamp,
    hasMedia: message.hasMedia ?? false,
    isForwarded: message.isForwarded,
    isStatus: message.isStatus,
    mentionedIds: normalizeWhatsappMentionIds(message.mentionedIds)
  }
}

export function mapWhatsappChat(chat: WhatsappChatLike, fallbackId: string): DeadByteChat {
  return {
    id: serializedId(chat.id, fallbackId),
    name: chat.name,
    isGroup: chat.isGroup ?? false
  }
}

export function mapWhatsappContact(contact: WhatsappContactLike, fallbackId: string): DeadByteContact {
  return {
    id: serializedId(contact.id, fallbackId),
    number: contact.number,
    name: contact.name,
    pushname: contact.pushname,
    isMe: contact.isMe,
    isMyContact: contact.isMyContact
  }
}
