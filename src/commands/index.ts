import { createStickerCommand } from './stickers/create-sticker.command.js'
import { stealStickerCommand } from './stickers/steal-sticker.command.js'
import { pingCommand } from './system/ping.command.js'
import { statusCommand } from './system/status.command.js'

export const commands = [pingCommand, statusCommand, createStickerCommand, stealStickerCommand]

export { createStickerCommand, pingCommand, statusCommand, stealStickerCommand }
