import { parseGroupConfigFromDescription, upsertGroupConfigBlock } from './group-config.parser.js'
import { DEFAULT_GROUP_CONFIG, type GroupConfig } from './group-config.types.js'
import type { WhatsappChatLike } from '../whatsapp/whatsapp-adapter.js'

export class GroupConfigService {
  private readonly configs = new Map<string, GroupConfig>()

  get(chatId: string): GroupConfig {
    return this.configs.get(chatId) ?? { ...DEFAULT_GROUP_CONFIG }
  }

  set(chatId: string, config: GroupConfig): GroupConfig {
    const next = { ...DEFAULT_GROUP_CONFIG, ...config }
    this.configs.set(chatId, next)
    return next
  }

  loadFromDescription(chatId: string, description: string | undefined): GroupConfig {
    return this.set(chatId, parseGroupConfigFromDescription(description))
  }

  async ensureLoaded(chat: WhatsappChatLike): Promise<GroupConfig> {
    const chatId = chat.id?._serialized ?? chat.id?.user ?? ''
    if (!chatId) return { ...DEFAULT_GROUP_CONFIG }
    if (this.configs.has(chatId)) return this.get(chatId)

    const freshChat = chat.description === undefined && chat.fetch ? await chat.fetch() : chat
    return this.loadFromDescription(chatId, freshChat?.description ?? chat.description)
  }

  async updateDescription(chat: WhatsappChatLike, config: GroupConfig): Promise<GroupConfig> {
    const chatId = chat.id?._serialized ?? chat.id?.user ?? ''
    const freshChat = chat.description === undefined && chat.fetch ? await chat.fetch() : chat
    const currentDescription = freshChat.description
    const nextDescription = upsertGroupConfigBlock(currentDescription, config)

    if (freshChat.setDescription) {
      await freshChat.setDescription(nextDescription)
    }

    return this.set(chatId, config)
  }
}
