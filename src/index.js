import wwebjs from 'whatsapp-web.js';

const client = new wwebjs.Client({
    authStrategy: new wwebjs.LocalAuth(),
    // proxyAuthentication: { username: 'username', password: 'password' },
    puppeteer: {
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
    // headless: false,
    },
});

client.initialize();

client.on('ready', () => {
    console.log('READY');
});

// queue system
const stickerQueue = new Map();
const stickerTextQueue = new Map();

setInterval(() => {
    if (stickerQueue.size > 0) {
        const firstKey = stickerQueue.keys().next().value;
        const firstItem = stickerQueue.get(firstKey);
        stickerQueue.delete(firstKey);
        makeSticker(firstItem);
    }
}, 1000);

async function makeSticker(msg) {
    const media = await msg.downloadMedia();
    if (!media) return console.error('Error downloading media');

    const chat = await msg.getChat();

    // send media as sticker back
    await chat.sendMessage(media, {
        sendMediaAsSticker: true,
        stickerAuthor: 'bot de figurinhas',
        stickerName: 'DeadByte.com.br',
        stickerCategories: ['💀', '🤖'],
    });
}

setInterval(() => {
    if (stickerTextQueue.size > 0) {
        const firstKey = stickerTextQueue.keys().next().value;
        const firstItem = stickerTextQueue.get(firstKey);
        stickerTextQueue.delete(firstKey);
        makeStickerText(firstItem);
    }
}, 1000);

async function makeStickerText(msg) {
    const media = await wwebjs.MessageMedia.fromUrl(`https://v1.deadbyte.com.br/image-creator/ttp/1?message=${msg.body}`, {
        unsafeMime: true,
    });
    if (!media) return console.error('Error downloading media');

    const chat = await msg.getChat();

    // send media as sticker back
    await chat.sendMessage(media, {
        sendMediaAsSticker: true,
        stickerAuthor: 'bot de figurinhas',
        stickerName: 'DeadByte.com.br',
        stickerCategories: ['💀', '🤖'],
    });
}

client.on('message', async (msg) => {
    console.log('MESSAGE RECEIVED', msg);
    if (msg.hasMedia) {
        return stickerQueue.set(msg.id, msg);
    }

    if (msg.body) {
        return stickerTextQueue.set(msg.id, msg);
    }
});