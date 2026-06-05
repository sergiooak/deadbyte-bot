import { dddCommand } from './utility/ddd.command.js'
import { ddiCommand } from './utility/ddi.command.js'
import { bootCorrectionCommand } from './fun/boot-correction.command.js'
import { diceCommand } from './fun/dice.command.js'
import { emojiCommand } from './fun/emoji.command.js'
import { mathCommand } from './fun/math.command.js'
import { reactCommand } from './fun/react.command.js'
import { disableGroupConfigCommand, enableGroupConfigCommand, setGroupConfigCommand, showGroupConfigCommand } from './groups/group-config.command.js'
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

export const commands = [menuCommand, pingCommand, statusCommand, timeCommand, showGroupConfigCommand, enableGroupConfigCommand, disableGroupConfigCommand, setGroupConfigCommand, createStickerCommand, fitStickerCommand, cropStickerCommand, stretchStickerCommand, stealStickerCommand, stickerToMediaCommand, emojiCommand, reactCommand, bootCorrectionCommand, diceCommand, mathCommand, dddCommand, ddiCommand]

export { bootCorrectionCommand, createStickerCommand, cropStickerCommand, dddCommand, ddiCommand, diceCommand, disableGroupConfigCommand, emojiCommand, enableGroupConfigCommand, fitStickerCommand, mathCommand, menuCommand, reactCommand, pingCommand, setGroupConfigCommand, showGroupConfigCommand, statusCommand, stealStickerCommand, stickerToMediaCommand, stretchStickerCommand, timeCommand }
