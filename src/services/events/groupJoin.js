import logger from '../../logger.js'
import spintax from '../../utils/spintax.js'
import { getClient } from '../../index.js'
/**
 * Emitted when a user joins the chat via invite link or is added by an admin.
 * @param {import('whatsapp-web.js').GroupNotification } notification GroupNotification with more information about the action
 * https://docs.wwebjs.dev/Client.html#event:group_join
 */

export default async (notification) => {
  // TODO: load the group configuration
  const type = notification.type // add or invite
  const author = notification.author
  const chat = notification.chatId
  const newMembers = notification.recipientIds // array of new members, usually just one
  const isPlural = newMembers.length > 1
  logger.info(`Member joined: ${type} - ${author} in ${chat}`)
  const client = getClient()

  if (type === 'add') {
    const prefix = '{🎉|🎊|🥳|👏|👑}'
    let message = `${prefix} - `
    if (isPlural) {
      message += '{Bem-vindos|Sejam bem-vindos(as)|Bem-vindos(as)} '
      // comma separated, but last one is 'and'
      message += newMembers.map((member, index) => {
        const isLast = index === newMembers.length - 1
        return `@${member.split('@')[0]}${isLast ? ' e' : ','}`
      }).join(' ')
      message += '\n\n*Leiam as regras do grupo!* E evitem serem removidos!'
    } else {
      message += '{Bem-vindo|Seja bem-vindo(a)|Bem-vindo(a)} '
      message += `@${newMembers[0].split('@')[0]}`
      message += '\n\n*Leia as regras do grupo!* E evite ser removido!'
    }
    message += 'ao grupo{!|!!|!!!}\n\n'
    message += `O(a) {admin|administrador(a)|adm} @${author.split('@')[0]} ${isPlural ? 'os adicionaram' : 'te adicionou'}!`
    return await client.sendMessage(chat, spintax(message), { mentions: newMembers.concat([author]) })
  }

  if (type === 'invite') {
    const prefix = '{🎉|🎊|🥳|👏|👑}'
    let message = `${prefix} - `
    if (isPlural) {
      message += '{Bem-vindos|Sejam bem-vindos(as)|Bem-vindos(as)} '
      // comma separated, but last one is 'and'
      message += newMembers.map((member, index) => {
        const isLast = index === newMembers.length - 1
        return `@${member.split('@')[0]}${isLast ? ' e' : ','}`
      }).join(' ')
      message += '\n\n*Leiam as regras do grupo!* E evitem serem removidos!'
    } else {
      message += '{Bem-vindo|Seja bem-vindo(a)|Bem-vindo(a)} '
      message += `@${newMembers[0].split('@')[0]}`
      message += '\n\n*Leia as regras do grupo!* E evite ser removido!'
    }
    message += 'ao grupo{!|!!|!!!}\n\n'
    message += `${isPlural ? 'Vocês entraram' : 'Você entrou'} no grupo através do link de convite!`
    return await client.sendMessage(chat, spintax(message), { mentions: newMembers })
  }

  logger.warn(`Unknown type: ${type}`)
}
