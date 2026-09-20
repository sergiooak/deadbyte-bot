import { EMOJI_REPLYABLE_TYPE, handleEmojiProviderReply } from '../../commands/fun/emoji.command.js'
import type { ReplyableService } from './replyable.service.js'

/**
 * Registra todos os handlers de mensagens respondiveis.
 * Cada feature que usa o fluxo de pergunta/resposta adiciona seu handler aqui.
 */
export function registerReplyableHandlers(service: ReplyableService): void {
  service.registerHandler(EMOJI_REPLYABLE_TYPE, handleEmojiProviderReply)
}
