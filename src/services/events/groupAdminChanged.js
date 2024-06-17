import logger from '../../logger.js'
import spintax from '../../utils/spintax.js'
import { getClient } from '../../index.js'
/**
 * Emitted when a current user is promoted to an admin or demoted to a regular user
 * @param {import('whatsapp-web.js').GroupNotification } notification GroupNotification with more information about the action
 * https://docs.wwebjs.dev/Client.html#event:group_admin_changed
 */

export default async (notification) => {
  const type = notification.type // promote or demote
  const author = notification.author
  const chat = notification.chatId
  logger.info(`Group admin changed: ${type} - ${author} in ${chat}`)
  const client = getClient()

  if (type === 'promote') {
    const prefix = '{🎉|🎊|🥳|👏|👑}'
    let message = `${prefix} - {Obrigado|Vlw|Valeu|Obrigadão} `
    message += '{por me promover|por me dar adm|por me dar admin|por me dar administrador} '
    message += `@${author.split('@')[0]}{!|!!|!!!}`
    message = spintax(message)
    return await client.sendMessage(chat, message, { mentions: [author] })
  }

  if (type === 'demote') {
    const prefix = '{😢|😭|😞|😔}'
    let message = `${prefix} - {Fui|Fui removido|Fui rebaixado} `
    message += '{de adm|de admin|de administrador} {por|pelo(a)} '
    message += `@${author.split('@')[0]}{!|!!|!!!}`
    message = spintax(message)
    return await client.sendMessage(chat, message, { mentions: [author] })
  }

  logger.warn(`Unknown type: ${type}`)
}
