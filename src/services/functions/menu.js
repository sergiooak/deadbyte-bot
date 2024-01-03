import relativeTime from 'dayjs/plugin/relativeTime.js'
import spintax from '../../utils/spintax.js'
import { getCommands } from '../../db.js'
import wwebjs from 'whatsapp-web.js'
import 'dayjs/locale/pt-br.js'
import dayjs from 'dayjs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

//
// ================================ Main Functions =================================
//
/**
 * Send the menu
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function menu (msg) {
  let commandGroups = await getCommands()

  // if there is image, send it
  const menu = commandGroups.find(c => c.slug === 'menu')
  let media
  if (menu.menuImageUrl) {
    media = await wwebjs.MessageMedia.fromUrl(menu.menuImageUrl, { unsafeMime: true })
    if (!media) throw new Error('Error downloading media')
  }

  // remove CommandGroups where hideFromMenu is true
  commandGroups = commandGroups.filter(c => !c.hideFromMenu)

  const prefix = msg.aux.prefix || '!'

  const isStickerOnly = process.env.BOT_TYPE === 'sticker'
  const stickerOnlyCommands = ['stickers']

  // filter commands that are not sticker only
  if (isStickerOnly) {
    commandGroups = commandGroups.filter(command => stickerOnlyCommands.includes(command.slug))
  }

  // reorder commands Group and commands sort by "order" field in both
  commandGroups = commandGroups.sort((a, b) => a.order - b.order).map(c => {
    c.commands = c.commands.sort((a, b) => a.order - b.order)
    return c
  })
  const commandsCount = commandGroups.reduce((acc, c) => acc + c.commands.length, 0)

  let message = isStickerOnly
    ? 'Este número é *somente* para figurinhas, se quiser todos os comandos utilize o bot completo disponivel em DeadByte.com.br\n\n'
    : `No momento o DeadByte possui ${commandsCount} comandos divididos em ${commandGroups.length} categorias\n\n`

  // Tell about commandless messages
  message += '*Para criar figurinhas básicas, você NÃO precisa de comandos, basta enviar o seu arquivo ou texto!!!*\n\n'

  // Tell About prefix
  message += 'Os seguintes prefixos são aceitos para os comandos: *! . # /*\n\n'

  // const menuEmojis = '{📋|🗒️|📜}'
  // message += '```━━━━━━━━━━ ' + menuEmojis + ' ━━━━━━━━━━```\n\n'

  // await msg.reply(JSON.stringify(commands, null, 2))

  commandGroups.forEach((commandGroup, i) => {
    message += '```━━━━━━━━━ ' + commandGroup.emoji + ' ━━━━━━━━━```\n\n'
    message += `*${commandGroup.description}*\n\n`
    commandGroup.commands.forEach(command => {
      command = structuredClone(command)
      command.command = prefix + (command.alternatives[0] || command.slug)
      command.alternatives = command.alternatives.slice(1)

      message += `${command.emoji} - *${command.name}*\n`
      message += `*${command.command}* - ${command.description}${
        command.alternatives.length
        ? '\n( ' + prefix + command.alternatives.join(' ' + prefix) + ' )'
        : ''
      }\n\n`.replace(prefix + '.', '.')
    })
    message += '\n'
  })

  // remove the last \n
  message = message.trim().replace(/\n$/, '').trim()
  // await msg.reply(JSON.stringify(msg.aux, null, 2))
  await msg.reply(spintax(message), undefined, { media })
}

export async function menuGroup (msg) {
  let commandGroups = await getCommands()

  // pick only the command group where slug == groups
  commandGroups = commandGroups.filter(c => c.slug === 'groups')

  await msg.react(commandGroups[0].emoji)

  // if there is image, send it
  let media
  if (commandGroups[0].menuImageUrl) {
    media = await wwebjs.MessageMedia.fromUrl(commandGroups[0].menuImageUrl, { unsafeMime: true })
    if (!media) throw new Error('Error downloading media')
  }

  const prefix = msg.aux.prefix || '!'

  // reorder commands Group and commands sort by "order" field in both
  commandGroups = commandGroups.sort((a, b) => a.order - b.order).map(c => {
    c.commands = c.commands.sort((a, b) => a.order - b.order)
    return c
  })
  const commandsCount = commandGroups.reduce((acc, c) => acc + c.commands.length, 0)

  let message = `O DeadByte possui ${commandsCount} comandos na categoria *${
    commandGroups[0].name
  }*\n\n`

  // Tell About prefix
  message += 'Os seguintes prefixos são aceitos para os comandos: *! . # /*\n\n'

  // const menuEmojis = '{📋|🗒️|📜}'
  // message += '```━━━━━━━━━━ ' + menuEmojis + ' ━━━━━━━━━━```\n\n'

  // await msg.reply(JSON.stringify(commands, null, 2))

  commandGroups.forEach((commandGroup, i) => {
    message += '```━━━━━━━━━ ' + commandGroup.emoji + ' ━━━━━━━━━━```\n\n'
    message += `*${commandGroup.description}*\n\n`
    commandGroup.commands.forEach(command => {
      command = structuredClone(command)
      command.command = prefix + (command.alternatives[0] || command.slug)
      command.alternatives = command.alternatives.slice(1)

      message += `${command.emoji} - *${command.name}*\n`
      message += `*${command.command}* - ${command.description}${
        command.alternatives.length
        ? '\n( ' + prefix + command.alternatives.join(' ' + prefix) + ' )'
        : ''
      }\n\n`.replace(prefix + '.', '.')
    })
    message += '\n'
  })

  // remove the last \n
  message = message.trim().replace(/\n$/, '').trim()
  // await msg.reply(JSON.stringify(msg.aux, null, 2))
  // await msg.reply(spintax(message))
  await msg.reply(spintax(message), undefined, { media })
}

//
// ================================== Helper Functions ==================================
//
