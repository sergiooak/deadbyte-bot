import { emojiCommand } from './fun/emoji.command.js'
import { reactCommand } from './fun/react.command.js'
import { createStickerCommand } from './stickers/create-sticker.command.js'
import { cropStickerCommand } from './stickers/crop.command.js'
import { fitStickerCommand } from './stickers/fit.command.js'
import { stealStickerCommand } from './stickers/steal-sticker.command.js'
import { stickerToMediaCommand } from './stickers/sticker-to-media.command.js'
import { stretchStickerCommand } from './stickers/stretch.command.js'
import { menuCommand } from './system/menu.command.js'
import { pingCommand } from './system/ping.command.js'
import { statusCommand } from './system/status.command.js'
import { timeCommand } from './system/time.command.js'

export const commands = [menuCommand, pingCommand, statusCommand, timeCommand, createStickerCommand, fitStickerCommand, cropStickerCommand, stretchStickerCommand, stealStickerCommand, stickerToMediaCommand, emojiCommand, reactCommand]

export { createStickerCommand, cropStickerCommand, emojiCommand, fitStickerCommand, menuCommand, reactCommand, pingCommand, statusCommand, stealStickerCommand, stickerToMediaCommand, stretchStickerCommand, timeCommand }
