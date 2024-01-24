import relativeTime from 'dayjs/plugin/relativeTime.js'
import { getLags } from '../../utils/lagMemory.js'
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
  const lagsLastHour = getLags(60)
  await msg.reply(JSON.stringify(lagsLastHour, null, 2))
}
