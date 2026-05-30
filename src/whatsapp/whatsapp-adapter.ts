export type WhatsappIdLike = {
  _serialized?: string
  user?: string
}

export type WhatsappContactLike = {
  id?: WhatsappIdLike
  number?: string
  name?: string
  pushname?: string
  isMe?: boolean
  isMyContact?: boolean
}

export type WhatsappChatLike = {
  id?: WhatsappIdLike
  name?: string
  isGroup?: boolean
  sendMessage?: (content: unknown, options?: Record<string, unknown>) => Promise<unknown>
}

export type WhatsappMediaLike = {
  data: string
  mimetype: string
  filename?: string
  filesize?: number
}

export type WhatsappMessageLike = {
  id?: WhatsappIdLike
  from: string
  to?: string
  author?: string
  body?: string
  type?: string
  timestamp?: number
  hasMedia?: boolean
  isForwarded?: boolean
  isStatus?: boolean
  mentionedIds?: string[]
  hasQuotedMsg?: boolean
  getChat?: () => Promise<WhatsappChatLike>
  getContact?: () => Promise<WhatsappContactLike>
  getQuotedMessage?: () => Promise<WhatsappMessageLike>
  downloadMedia?: () => Promise<WhatsappMediaLike | undefined>
  reply?: (text: string) => Promise<unknown>
  react?: (emoji: string) => Promise<unknown>
}

export type WhatsappClientLike = {
  info?: {
    wid?: WhatsappIdLike
    pushname?: string
  }
  initialize: () => Promise<void>
  destroy: () => Promise<void>
  logout: () => Promise<void>
  sendMessage: (chatId: string, content: unknown, options?: Record<string, unknown>) => Promise<unknown>
  on: (event: string, listener: (...args: unknown[]) => void) => WhatsappClientLike
  getState?: () => Promise<string>
}
