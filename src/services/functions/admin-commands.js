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
  // Debug code goes here

  // Then react to the message
  await msg.react(msg.aux.db.command.emoji)
}
