import wwebjs from 'whatsapp-web.js';
import { stickerQueue, stickerTextQueue } from '../queue.js';


// ================================ Variables =================================



// ================================ Main Function =============================
/**
 * Emitted when a new message is received.
 * @param {wwebjs.Message} msg
 * @see https://docs.wwebjs.dev/Client.html#event:message
 */
export default async (msg) => {
    if (msg.hasMedia && (msg.type === 'image' || msg.type === 'video' || msg.type === 'sticker')) {
        await msg.react('⏳');
        return stickerQueue.set(msg.id, msg);
    }

    if (msg.body && msg.type === 'chat') {
        await msg.react('⏳');
        return stickerTextQueue.set(msg.id, msg);
    }
};

// ================================ Aux Functions =============================
