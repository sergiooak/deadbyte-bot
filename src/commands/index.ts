import { emojiCommand } from './fun/emoji.command.js'
import { emojiReactCommand } from './fun/emoji-react.command.js'
import { createStickerCommand } from './stickers/create-sticker.command.js'
import { stealStickerCommand } from './stickers/steal-sticker.command.js'
import { pingCommand } from './system/ping.command.js'
import { statusCommand } from './system/status.command.js'

export const commands = [pingCommand, statusCommand, createStickerCommand, stealStickerCommand, emojiCommand, emojiReactCommand]

export { createStickerCommand, emojiCommand, emojiReactCommand, pingCommand, statusCommand, stealStickerCommand }
