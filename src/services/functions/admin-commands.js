import relativeTime from 'dayjs/plugin/relativeTime.js'
import 'dayjs/locale/pt-br.js'
import dayjs from 'dayjs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

//
// ================================ Main Functions =================================
//

/**
 * Tests functions
 * @param {import('../../types').WWebJSMessage} msg
 */
export async function debug (msg) {
  const debugEmoji = '🐛'
  await msg.react(debugEmoji)

  const announceGroup = '120363094244463491@g.us'
  const chat = await msg.aux.client.getChatById(announceGroup)
  const admins = chat.participants.filter(p => p.isAdmin || p.isSuperAdmin).map((p) => p.id._serialized)
  const botIsAdmin = admins.includes(msg.aux.me)

  await msg.reply(JSON.stringify(botIsAdmin, null, 2))
}
