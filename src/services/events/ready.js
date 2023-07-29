import logger from '../../logger.js'
import { getClient } from '../../index.js'
import { addToQueue } from '../queue.js'
import importFresh from '../../utils/importFresh.js'
import spintax from '../../utils/spintax.js'

/**
 * Emitted when the client has initialized and is ready to receive messages.
 * @see https://docs.wwebjs.dev/Client.html#event:ready
 */

export default async () => {
  logger.info('Client is ready!')

  // check for unread messages
  const client = getClient()
  const chats = await client.getChats()

  for await (const chat of chats) {
    const unreadMessages = await chat.fetchMessages({ limit: 10 })
    let unreadMessagesCount = 0
    let hasRevokedMessages = false
    for (const msg of unreadMessages.reverse()) { // reverse to get the earliest messages first
      if (msg.fromMe) {
        break // if message is from me, don't parse any more from this chat
      }

      if (msg.type.toUpperCase() === 'REVOKED') {
        hasRevokedMessages = true
        msg.react('🚮')
      }
      const messageParser = await importFresh('../validators/message.js')
      const command = await messageParser.default(msg)
      if (command) {
        logger.info(`📥 - [${msg.from.split('@')[0]} - ${command.type}.${command.command}()`)
        addToQueue(msg.from, command.type, command.command, msg)
      }
      unreadMessagesCount++
    }

    if (unreadMessagesCount !== 0) {
      logger.info(`📥 - [${chat.name}] - ${unreadMessagesCount} unread messages`)

      // this means that user has deleted before the bot could read it
      if (hasRevokedMessages) {
        const saudation = '{🤖|👋|💀🤖}  - {Olá|Oi|Oie|E aí|Oi tudo bem?}!'
        const part1 = '{Se|Caso|Se caso} {você|voce|vc} {não|ñ|nao} tivesse {apagado|deletado|removido|excluído}'
        const part2 = 'as mensagens {eu|o bot|o DeadByte} {tava|estava|estaria|taria} te {respondendo|mandando} agora!'
        const laugh = '{kk|rsrs|hehe|kkk|🤣|haha}'

        const message = spintax(`${saudation} ${part1} ${part2} ${laugh}`)

        chat.sendMessage(message)
      }
    }

    await chat.sendSeen()
  }
}
