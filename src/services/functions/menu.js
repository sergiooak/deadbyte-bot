import { MessageMedia } from '../../meta/messageMedia.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import spintax from '../../utils/spintax.js'
import { getCommands } from '../../db.js'
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
  await msg.react('📜')

  let commandGroups = await getCommands()

  const menuImages = [
    'https://i.ibb.co/bPm0d0P/DALL-E-2024-01-10-18-12-59-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/pWQX5cG/DALL-E-2024-01-10-18-13-36-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/NZTH1Md/DALL-E-2024-01-10-18-15-58-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/N9Wx5kX/DALL-E-2024-01-10-18-12-15-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/J3YxtWW/DALL-E-2024-01-10-18-27-59-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/6mgDs61/DALL-E-2024-01-10-18-27-55-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/PZ5zvk6/DALL-E-2024-01-10-18-30-27-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/Vvvcgs6/DALL-E-2024-01-10-18-30-22-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/cxMHFtk/DALL-E-2024-01-10-18-34-02-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/Wkwrk6s/DALL-E-2024-01-10-18-34-00-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/BPbHPmY/DALL-E-2024-01-10-18-32-55-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png',
    'https://i.ibb.co/Ybnhxcm/DALL-E-2024-01-10-18-32-53-Disney-Pixar-style-character-from-the-movie-Dead-Byte-a-cute-skeleton-rob.png'
  ]
  const randomImage = menuImages[Math.floor(Math.random() * menuImages.length)]

  const media = await MessageMedia.fromUrl(randomImage)
  if (!media) throw new Error('Error downloading media')

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

  // const readMore = '​'.repeat(783)
  // message += readMore
  // const menuEmojis = '{📋|🗒️|📜}'
  // message += '```•·········• ' + menuEmojis + ' •·········•```\n\n'

  // await msg.reply(JSON.stringify(commands, null, 2))

  commandGroups.forEach((commandGroup, i) => {
    message += '```•·········• ' + commandGroup.emoji + ' •·········•```\n\n'
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
  await msg.reply({ media, caption: spintax(message) }, undefined)
}

export async function menuGroup (msg) {
  let commandGroups = await getCommands()

  // pick only the command group where slug == groups
  commandGroups = commandGroups.filter(c => c.slug === 'groups')

  await msg.react(commandGroups[0].emoji)

  // if there is image, send it
  let media
  if (commandGroups[0].menuImageUrl) {
    media = await MessageMedia.fromUrl(commandGroups[0].menuImageUrl)
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
  // message += '```•·········• ' + menuEmojis + ' •·········•```\n\n'

  // await msg.reply(JSON.stringify(commands, null, 2))

  commandGroups.forEach((commandGroup, i) => {
    message += '```•·········• ' + commandGroup.emoji + ' •·········•```\n\n'
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
