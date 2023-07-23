import wwebjs from 'whatsapp-web.js';
import { makeSticker, makeStickerText } from '../services/functions/sticker.js';

/**
 * Sticker queue
 * @type {Map<wwebjs.MessageId, wwebjs.Message>}
 */
const stickerQueue = new Map();
setInterval(() => {
    if (stickerQueue.size > 0) {
        const firstKey = stickerQueue.keys().next();
        const firstItem = stickerQueue.get(firstKey.value);

        // get every other message from the same chat (msg.from)
        const chat = firstItem.from;
        const chatMessages = [...stickerQueue.values()].filter(msg => msg.from === chat);

        // move every message from the same chat to the end of the queue
        chatMessages.forEach(msg => {
            stickerQueue.delete(msg.id);
            stickerQueue.set(msg.id, msg);
        });

        stickerQueue.delete(firstKey.value);
        makeSticker(firstItem, true);
        makeSticker(firstItem, false);
    }
}, 1000);

/**
 * Sticker text queue
 * @type {Map<string, wwebjs.Message>}
 */
const stickerTextQueue = new Map();
setInterval(() => {
    if (stickerTextQueue.size > 0) {
        const firstKey = stickerTextQueue.keys().next();
        const firstItem = stickerTextQueue.get(firstKey.value);

        // get every other message from the same chat (msg.from)
        const chat = firstItem.from;
        const chatMessages = [...stickerQueue.values()].filter(msg => msg.from === chat);

        // move every message from the same chat to the end of the queue
        chatMessages.forEach(msg => {
            stickerQueue.delete(msg.id);
            stickerQueue.set(msg.id, msg);
        });

        stickerTextQueue.delete(firstKey.value);
        makeStickerText(firstItem);
    }
}, 1000);

export { stickerQueue, stickerTextQueue };