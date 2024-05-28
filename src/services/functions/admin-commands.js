import relativeTime from 'dayjs/plugin/relativeTime.js'
import { getLags } from '../../utils/lagMemory.js'
import { getClient } from '../../index.js'
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

  // debug code here

  // get all chats
  const client = getClient()
  const chats = await client.getChats()
  const groups = chats.filter(chat => chat.isGroup)
  await msg.reply(groups.map(group => `${group.name} - ${group.id._serialized}`).join('\n\n'))
}
