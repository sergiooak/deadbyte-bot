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
 * Check if the command is disabled and send a message if it is
 * @param {import('../types.d.ts').WWebJSMessage} msg
 */
export default async (msg) => {
  const db = msg.aux.db

  const isEnabled = db?.command.enabled ?? true
  if (isEnabled) return true

  await msg.react(reactions.disabled)
  const prefix = msg.aux.prefix || '!'
  // prefixo + alternativa aleatoria OU slug
  const command = db.command.alternatives?.[Math.floor(Math.random() * db.command.alternatives.length)] || db.command.slug

  let message = `${db.command?.emoji || reactions.disabled} - `
  message += db.command.disableMessage || `O comando ${prefix}${command} está desabilitado`

  message = message.replace(/{{prefix}}/g, prefix)
  message = message.replace(/{{command}}/g, command)

  await msg.reply(spintax(message))
  return false
}

//
// ================================== Helper Functions ==================================
//
