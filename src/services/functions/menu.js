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

export async function menu (msg) {
  let commands = await getCommands()
  const lang = 'pt'
  const prefix = msg.aux.prefix || '!'

  const isStickerOnly = process.env.BOT_TYPE === 'sticker'
  const stickerOnlyCommands = ['stickers']

  // filter commands that are not sticker only
  if (isStickerOnly) {
    commands = commands.filter(command => stickerOnlyCommands.includes(command.slug))
  }

  const groupsArray = commands.map(c => c.name[lang])
  const commandsArray = commands.map(c => c.commands.filter(c => c.enabled).map(c => {
    return {
      name: c.name[lang],
      command: prefix + (c.alternatives[0] || c.slug),
      description: c.description[lang],
      enabled: c.enabled,
      alternatives: c.alternatives.slice(1)
    }
  }))

  let message = isStickerOnly
    ? 'Este número é *somente* para figurinhas, se quiser todos os comandos utilize o bot completo disponivel em DeadByte.com.br\n\n'
    : `No momento o DeadByte possui ${commandsArray.reduce((acc, c) => acc + c.length, 0)} comandos divididos em ${commandsArray.length} categorias\n\n`

  // Tell about commandless messages
  message += '*Para criar figurinhas básicas, você NÃO precisa de comandos, basta enviar o seu arquivo ou texto!!!*\n\n'

  const menuEmojis = '{📋|🗒️|📜}'
  message += '```━━━━━━━━━━ ' + menuEmojis + ' ━━━━━━━━━━```\n\n'

  // Tell About prefix
  message += 'Os seguintes prefixos são aceitos para os comandos: *! . # /*\n\n'
  commandsArray.forEach((c, i) => {
    message += `*${groupsArray[i].toUpperCase()}:*\n\n`
    c.forEach(c => {
      message += `*${c.command}* - _${c.description}_${c.alternatives.length ? '\n<' + prefix + c.alternatives.join(' ' + prefix) + '>' : ''}\n\n`.replace(prefix + '.', '.')
    })
    message += '\n'
  })

  // remove the last \n
  message = message.trim().replace(/\n$/, '').trim()
  // await msg.reply(JSON.stringify(msg.aux, null, 2))
  await msg.reply(spintax(message))
}

//
// ================================== Helper Functions ==================================
//
