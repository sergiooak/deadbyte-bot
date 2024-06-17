import logger from '../../logger.js'
import spintax from '../../utils/spintax.js'
import { getClient } from '../../index.js'
/**
 * Emitted when a user leaves the chat or is removed by an admin.
 * @param {import('whatsapp-web.js').GroupNotification } notification GroupNotification with more information about the action
 * https://docs.wwebjs.dev/Client.html#event:group_leave
 */

export default async (notification) => {
  // TODO: load the group configuration
  const type = notification.type // remove or leave
  const author = notification.author
  const chat = notification.chatId
  const newMembers = notification.recipientIds // array of new members, usually just one
  const isPlural = newMembers.length > 1
  logger.info(`Member left: ${type} - ${author} in ${chat}`)
  const client = getClient()
  const authorIsMe = author === client.info.wid._serialized

  if (type === 'remove') {
    let message = '🔨 - '
    if (authorIsMe) {
      message += 'Eu dei ban no(a) '
    } else {
      message += `O(a) admin @${author.split('@')[0]} `
      message += '{removeu|deu ban no(a)|baniu} '
    }

    if (isPlural) {
      message += newMembers.map((member, index) => {
        const isLast = index === newMembers.length - 1
        return `+${member.split('@')[0]}${isLast ? 'e ' : ', '}`
      }).join(' ')
    } else {
      message += `+${newMembers[0].split('@')[0]}`
    }
    message += '{!|!!|!!!}'
    return await client.sendMessage(chat, spintax(message), { mentions: newMembers.concat([author]) })
  }

  if (type === 'leave') {
    let message = '{😢|😭|😞|😔} - '
    if (isPlural) {
      message += newMembers.map((member, index) => {
        const isLast = index === newMembers.length - 1
        return `+${member.split('@')[0]}${isLast ? 'e ' : ', '}`
      }).join(' ')
      message += '{sairam|deixaram|vazaram} do grupo{!|!!|!!!}'
    } else {
      message += `+${newMembers[0].split('@')[0]} `
      message += '{saiu|deixou|vazou} do grupo{!|!!|!!!}'
    }
    return await client.sendMessage(chat, spintax(message), { mentions: newMembers.concat([author]) })
  }

  logger.warn(`Unknown type: ${type}`)
}
