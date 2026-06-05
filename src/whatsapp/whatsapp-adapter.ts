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

export type WhatsappGroupParticipantLike = {
  id?: WhatsappIdLike
  isAdmin?: boolean
  isSuperAdmin?: boolean
}

export type WhatsappGroupMembershipRequestLike = {
  id?: WhatsappIdLike | string
  requesterId?: WhatsappIdLike | string
  participantId?: WhatsappIdLike | string
}

export type WhatsappLidPhoneLike = {
  lid: string
  pn: string
}

export type WhatsappChatLike = {
  id?: WhatsappIdLike
  name?: string
  isGroup?: boolean
  description?: string
  participants?: WhatsappGroupParticipantLike[]
  sendMessage?: (content: unknown, options?: Record<string, unknown>) => Promise<unknown>
  fetchMessages?: (searchOptions: { limit?: number; fromMe?: boolean }) => Promise<WhatsappMessageLike[]>
  setMessagesAdminsOnly?: (adminsOnly?: boolean) => Promise<unknown>
  promoteParticipants?: (participantIds: string[]) => Promise<unknown>
  demoteParticipants?: (participantIds: string[]) => Promise<unknown>
  removeParticipants?: (participantIds: string[]) => Promise<unknown>
  addParticipants?: (participantIds: string[], options?: Record<string, unknown>) => Promise<unknown>
  getGroupMembershipRequests?: () => Promise<WhatsappGroupMembershipRequestLike[]>
  approveGroupMembershipRequests?: (options?: Record<string, unknown>) => Promise<unknown>
  rejectGroupMembershipRequests?: (options?: Record<string, unknown>) => Promise<unknown>
  setDescription?: (description: string) => Promise<unknown>
  fetch?: () => Promise<WhatsappChatLike>
}

export type WhatsappMediaLike = {
  data: string
  mimetype: string
  filename?: string
  filesize?: number
}

export type WhatsappMessageSendOptionsLike = Record<string, unknown>

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
  mentionedIds?: Array<string | WhatsappIdLike>
  hasQuotedMsg?: boolean
  getChat?: () => Promise<WhatsappChatLike>
  getContact?: () => Promise<WhatsappContactLike>
  getMentions?: () => Promise<WhatsappContactLike[]>
  getQuotedMessage?: () => Promise<WhatsappMessageLike>
  downloadMedia?: () => Promise<WhatsappMediaLike | undefined>
  delete?: (everyone?: boolean, clearMedia?: boolean) => Promise<unknown>
  reply?: (text: string, chatId?: string, options?: WhatsappMessageSendOptionsLike) => Promise<unknown>
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
  sendMessage: (chatId: string, content: unknown, options?: WhatsappMessageSendOptionsLike) => Promise<unknown>
  on: (event: string, listener: (...args: unknown[]) => void) => WhatsappClientLike
  getState?: () => Promise<string>
  getContactLidAndPhone?: (userIds: string[]) => Promise<WhatsappLidPhoneLike[]>
  getChatById?: (chatId: string) => Promise<WhatsappChatLike>
}

export type WhatsappGroupNotificationLike = {
  chatId?: string
  id?: WhatsappIdLike
  author?: string
  recipientIds?: string[]
  recipients?: string[]
}
