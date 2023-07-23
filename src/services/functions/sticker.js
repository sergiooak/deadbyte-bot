import wwebjs from 'whatsapp-web.js';
import Util from '../../utils/sticker.js';
import sharp from 'sharp';
import { getClient } from '../../index.js';

/**
 * Make sticker from media (image, video, gif)
 * @param {wwebjs.Message} msg
 * @param {boolean} crop
 */
export async function makeSticker(msg, crop = false) {
    let media = await msg.downloadMedia();
    if (!media) return console.error('Error downloading media');
    let stickerMedia = await Util.formatToWebpSticker(media, {}, crop);
    let mediaBuffer = Buffer.from(stickerMedia.data, 'base64');

    // if message has body, add it to the sticker as subtitle
    const subtitle = msg.body ? msg.body : undefined;
    if(subtitle) {
        const subtitleMedia = await wwebjs.MessageMedia.fromUrl(`https://v1.deadbyte.com.br/image-creator/ttp/1?message=${subtitle}&subtitle=true`, {
            unsafeMime: true,
        });
        if (!subtitleMedia) return console.error('Error downloading media');
        const subtitleBuffer = Buffer.from(subtitleMedia.data, 'base64');
        

        // using sharp, overlay the subtitleBuffer on top of the mediaBuffer, compress to be smaller than 1MB
        const finalBuffer = await sharp(mediaBuffer, { animated: true })
            .composite([{
                input: subtitleBuffer,
                gravity: 'south',
                animated: true,
                tile: true
            }])
            .webp()
            .toBuffer();    

        // replace media data with the new data from sharp
        stickerMedia = new wwebjs.MessageMedia('image/webp', finalBuffer.toString('base64'), 'deadbyte.webp', true);
    }

    const chat = await msg.getChat();

    // if heavier than 1MB, compress it
    media = new wwebjs.MessageMedia('image/webp', stickerMedia.data, 'deadbyte.webp', true);
    mediaBuffer = Buffer.from(stickerMedia.data, 'base64');

    if (mediaBuffer.byteLength > 1_000_000) {
        console.log('compressing sticker...', mediaBuffer.byteLength);
        const compressedBuffer = await sharp(mediaBuffer, { animated: true })
            .webp({ quality: 33 })
            .toBuffer();
        media = new wwebjs.MessageMedia('image/webp', compressedBuffer.toString('base64'), 'deadbyte.webp', true);
        console.log('compressed sticker!', mediaBuffer.byteLength, '->', compressedBuffer.byteLength);
        mediaBuffer = Buffer.from(media.data, 'base64');
    }

    // if still heavier than 1MB, throw error
    if (mediaBuffer.byteLength > 1_000_000) {
        console.error('sticker is still too heavy!', mediaBuffer.byteLength);
        return await msg.react('⚓');
    }

    // send media as sticker back
    await chat.sendMessage(media, {
        sendMediaAsSticker: true,
        stickerAuthor: 'bot de figurinhas',
        stickerName: 'DeadByte.com.br',
        stickerCategories: ['💀', '🤖'],
    });

    if(!crop) await msg.react('✅');
}

/**
 * Make sticker from text
 * @param {wwebjs.Message} msg
 */
export async function makeStickerText(msg) {
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

    await msg.react('✅');
}