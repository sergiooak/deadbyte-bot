import { emojiCommand } from './fun/emoji.command.js'
import { reactCommand } from './fun/react.command.js'
import { createStickerCommand } from './stickers/create-sticker.command.js'
import { stealStickerCommand } from './stickers/steal-sticker.command.js'
import { pingCommand } from './system/ping.command.js'
import { statusCommand } from './system/status.command.js'
import { timeCommand } from './system/time.command.js'

export const commands = [pingCommand, statusCommand, timeCommand, createStickerCommand, stealStickerCommand, emojiCommand, reactCommand]

export { createStickerCommand, emojiCommand, reactCommand, pingCommand, statusCommand, stealStickerCommand, timeCommand }
