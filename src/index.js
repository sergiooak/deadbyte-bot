import wwebjs from 'whatsapp-web.js';
import { stickerQueue, stickerTextQueue } from './services/queue.js';
/**
 * Whatsapp Web Client
 * @type {wwebjs.Client}
 */
const client = new wwebjs.Client({
    authStrategy: new wwebjs.LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
    // headless: false,
    },
});

/**
 * Get Whatsapp Web Client
 * @returns {wwebjs.Client}
 */
export function getClient() {
    return client;
}

client.initialize();

client.on('ready', () => {
    console.log('READY');
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    const chatId = chat.id._serialized;

    if (msg.hasMedia) {
        await msg.react('⏳');
        return stickerQueue.set(msg.id, msg);
    }

    if (msg.body && msg.type === 'chat') {
        await msg.react('⏳');
        return stickerTextQueue.set(msg.id, msg);
    }
});