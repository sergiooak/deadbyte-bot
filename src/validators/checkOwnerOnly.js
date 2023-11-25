import relativeTime from 'dayjs/plugin/relativeTime.js'
import reactions from '../config/reactions.js'
import spintax from '../utils/spintax.js'
// import { getCommands } from '../../db.js'
// import wwebjs from 'whatsapp-web.js'
import 'dayjs/locale/pt-br.js'
import dayjs from 'dayjs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

//
// ================================ Main Functions =================================
//
/**
 * Check if the command is usable only by bot owner and send a message if it is
 * @param {import('../types.js').WWebJSMessage} msg
 */
export default async (msg) => {
  const db = msg.aux.db

  const isBotOwnerOnly = db?.command.isBotOwnerOnly ?? false
  if (!isBotOwnerOnly) return false

  const isUserOwner = db?.contact?.attributes.isOwner ?? false
  if (isUserOwner) return false

  await msg.react(reactions.ownerOnly)
  const prefix = msg.aux.prefix || '!'
  // prefixo + alternativa aleatoria OU slug
  const command = db.command.alternatives?.[Math.floor(Math.random() * db.command.alternatives.length)] || db.command.slug

  let message = `${db.command?.emoji || reactions.ownerOnly} - `
  message += `O comando ${prefix}${command} só pode ser usado por meu criador`

  message = message.replace(/{{prefix}}/g, prefix)
  message = message.replace(/{{command}}/g, command)

  await msg.reply(spintax(message))
  return true
}

//
// ================================== Helper Functions ==================================
//
