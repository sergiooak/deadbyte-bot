import { dddCommand } from './utility/ddd.command.js'
import { ddiCommand } from './utility/ddi.command.js'
import { diceCommand } from './fun/dice.command.js'
import { emojiCommand } from './fun/emoji.command.js'
import { mathCommand } from './fun/math.command.js'
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

export const commands = [menuCommand, pingCommand, statusCommand, timeCommand, createStickerCommand, fitStickerCommand, cropStickerCommand, stretchStickerCommand, stealStickerCommand, stickerToMediaCommand, emojiCommand, reactCommand, diceCommand, mathCommand, dddCommand, ddiCommand]

export { createStickerCommand, cropStickerCommand, dddCommand, ddiCommand, diceCommand, emojiCommand, fitStickerCommand, mathCommand, menuCommand, reactCommand, pingCommand, statusCommand, stealStickerCommand, stickerToMediaCommand, stretchStickerCommand, timeCommand }
