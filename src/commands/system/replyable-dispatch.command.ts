import { defineCommand } from '@deadbyte/runtime'
import type { ReplyableService } from '../../services/replyable/replyable.service.js'

type ReplyableServices = {
  replyables?: ReplyableService
}

/**
 * Intercepta respostas a mensagens "respondiveis" enviadas pelo bot.
 * Deve ser registrado ANTES dos demais comandos para ter prioridade quando
 * a mensagem citada corresponder a um registro de respondivel.
 */
export const replyableDispatchCommand = defineCommand({
  id: 'system.replyable-dispatch',
  group: 'system',
  name: 'Respostas interativas',
  description: 'Roteia respostas a mensagens que aguardam resposta do usuário.',
  aliases: [],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  hiddenFromMenu: true,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    if (ctx.parsedCommand?.explicit) return false
    const services = ctx.services as ReplyableServices
    const entry = services.replyables?.get(ctx.quotedMessage?.id)
    return Boolean(entry && entry.chatId === ctx.chat.id)
  },
  async run(ctx) {
    const services = ctx.services as ReplyableServices
    const entry = services.replyables?.get(ctx.quotedMessage?.id)
    if (!entry) return
    const handler = services.replyables?.getHandler(entry.type)
    if (!handler) return
    await handler(ctx, entry.payload, ctx.message.body?.trim() ?? '')
  }
})
