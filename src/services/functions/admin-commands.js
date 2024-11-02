import relativeTime from 'dayjs/plugin/relativeTime.js'
// import { getClient } from '../../spawn.js'
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
}

/**
 * Sync functions
 * @param {import('../../types').WWebJSMessage} msg
 */
export async function sync (msg) {
  const syncEmoji = '🔄'
  await msg.react(syncEmoji)

  console.log(msg.db)
}
