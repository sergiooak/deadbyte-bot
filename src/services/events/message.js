import { stickerQueue, stickerTextQueue } from '../queue.js'
import importFresh from '../../utils/importFresh.js'
//
// ================================ Main Function =============================
//
/**
 * Emitted when a new message is received.
 * @param {import('whatsapp-web.js').Message} msg
 * @see https://docs.wwebjs.dev/Client.html#event:message
 */
export default async (msg) => {
  /**
     * Parse message and check if it is to respond, module is imported fresh to force it to be reloaded from disk.
     * @type {import('../../validators/message.js')}
     */
  const messageParser = await importFresh('../validators/message.js')
  const command = await messageParser.default(msg)
  if (command) {
    console.log('command: ', command)
    await msg.react('⏳')

    if (command.type === 'sticker') {
      if (command.command === 'sticker') {
        return stickerQueue.set(msg.id, msg)
      }

      if (command.command === 'stickerText') {
        return stickerTextQueue.set(msg.id, msg)
      }
    }
  }
}
