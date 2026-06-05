import { dddCommand } from './utility/ddd.command.js'
import { ddiCommand } from './utility/ddi.command.js'
import { bootCorrectionCommand } from './fun/boot-correction.command.js'
import { coinCommand } from './fun/coin.command.js'
import { diceCommand } from './fun/dice.command.js'
import { emojiCommand } from './fun/emoji.command.js'
import { mathCommand } from './fun/math.command.js'
import { reactCommand } from './fun/react.command.js'
import { disableGroupConfigCommand, enableGroupConfigCommand, setGroupConfigCommand, showGroupConfigCommand } from './groups/group-config.command.js'
import { addParticipantCommand, banCommand, callAdminsCommand, closeGroupCommand, deleteGroupMessageCommand, demoteCommand, everyoneCommand, giveawayAdminsCommand, giveawayCommand, membershipRequestsCommand, openGroupCommand, promoteCommand, rulesCommand, russianRouletteCommand } from './groups/group-moderation.command.js'
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

export const commands = [menuCommand, pingCommand, statusCommand, timeCommand, showGroupConfigCommand, enableGroupConfigCommand, disableGroupConfigCommand, setGroupConfigCommand, openGroupCommand, closeGroupCommand, promoteCommand, demoteCommand, banCommand, addParticipantCommand, deleteGroupMessageCommand, callAdminsCommand, everyoneCommand, giveawayCommand, giveawayAdminsCommand, russianRouletteCommand, rulesCommand, membershipRequestsCommand, createStickerCommand, fitStickerCommand, cropStickerCommand, stretchStickerCommand, stealStickerCommand, stickerToMediaCommand, emojiCommand, reactCommand, bootCorrectionCommand, coinCommand, diceCommand, mathCommand, dddCommand, ddiCommand]

export { addParticipantCommand, banCommand, bootCorrectionCommand, callAdminsCommand, closeGroupCommand, coinCommand, createStickerCommand, cropStickerCommand, dddCommand, demoteCommand, ddiCommand, diceCommand, deleteGroupMessageCommand, disableGroupConfigCommand, emojiCommand, enableGroupConfigCommand, everyoneCommand, fitStickerCommand, giveawayAdminsCommand, giveawayCommand, mathCommand, membershipRequestsCommand, menuCommand, openGroupCommand, promoteCommand, reactCommand, pingCommand, rulesCommand, russianRouletteCommand, setGroupConfigCommand, showGroupConfigCommand, statusCommand, stealStickerCommand, stickerToMediaCommand, stretchStickerCommand, timeCommand }
