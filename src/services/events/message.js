import { stickerQueue, stickerTextQueue } from '../queue.js'
import importFresh from '../../utils/importFresh.js'
import path from 'path'
//
// ================================ Main Function =============================
//
/**
 * Emitted when a new message is received.
 * @param {import('whatsapp-web.js').Message} msg
 * @see https://docs.wwebjs.dev/Client.html#event:message
 */
export default async (msg) => {
  try {
    /**
     * Parse message and check if it is to respond, module is imported fresh to force it to be reloaded from disk.
     * @type {import('../../validators/message.js')}
     */
    const messageParser = await importFresh(path.resolve('./src/validators/message.js'))
    const command = await messageParser.default(msg)
    if (command) {
      console.log('command: ', command)
    }
  } catch (error) {
    console.log('error: ', error)
  }
  if (msg.hasMedia && (msg.type === 'image' || msg.type === 'video' || msg.type === 'sticker')) {
    await msg.react('⏳')
    return stickerQueue.set(msg.id, msg)
  }

  if (msg.body && msg.type === 'chat') {
    await msg.react('⏳')
    return stickerTextQueue.set(msg.id, msg)
  }
}

//
// ================================ Aux Functions =============================
//
