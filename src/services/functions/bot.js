import spintax from '../../utils/spintax.js'
import fetch from 'node-fetch'
import { getCommands } from '../../db.js'

//
// ================================ Main Functions =================================
//
/**
 * return uptime
 * @param {wwebjs.Message} msg
 */
export async function uptime (msg) {
  const uptime = process.uptime()
  const uptimeString = secondsToDhms(uptime)
  const [days, hours, minutes, seconds] = uptimeString.split(':')

  const clock = '{⏳|⌚|⏰|⏱️|⏲️|🕰️|🕛|🕧|🕐|🕜|🕑|🕝}'
  await msg.react(spintax(clock)) // react with random clock emoji

  const saudation = `{${spintax(clock)}} - {Olá|Oi|Oie|E aí} ${msg.aux.sender.pushname || 'usuário'} tudo {jóia|bem}?`
  const part1 = '{Eu estou|Estou|O bot {está|ta|tá}|O DeadByte {está|ta|tá}} {online|on|ligado}{ direto|} {a|á|tem}{:|}'

  let daysPart = parseInt(days) > 0 ? `${days}{ dias|d} ` : ''
  if (parseInt(days) === 1) daysPart = daysPart.replace('dias', 'dia')

  let hoursPart = `${parseInt(hours)}{ horas|h}`
  if (parseInt(hours) === 1) hoursPart = hoursPart.replace('horas', 'hora')

  const minutesPart = `${parseInt(minutes)}{ minutos|min|m}`
  const secondsPart = `{ e ${parseInt(seconds)}{ segundos|s}}`

  const message = spintax(`${saudation}\n\n${part1}\n*${daysPart}${hoursPart} ${minutesPart}${secondsPart}*`)
  await msg.reply(message)
}

/**
 * React with a random emoji
 * @param {wwebjs.Message} msg
 */
export async function react (msg) {
  const response = await fetch('https://emojihub.yurace.pro/api/random')
  const json = await response.json()
  const emoji = String.fromCodePoint(...json.unicode.map(u => parseInt(u.replace('U+', '0x'), 16)))
  await msg.react(emoji)
  await msg.aux.chat.sendSeen()
}

export async function dice (msg) {
  const max = parseInt(msg.aux.function.replace('d', ''))
  const min = 1
  let message = `🎲 - Você rolou *${Math.floor(Math.random() * (max - min + 1)) + min}*`
  message += `\n\nEm um dado de ${max} lados`
  await msg.reply(message)
}

export async function menu (msg) {
  const commands = await getCommands()
  const lang = 'pt'
  const prefix = msg.aux.prefix || '!'

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

  let message = `🤖 - No momento o DeadByte possui ${commandsArray.reduce((acc, c) => acc + c.length, 0)} comandos divididos em ${commandsArray.length} categorias\n\n`
  commandsArray.forEach((c, i) => {
    message += `*${groupsArray[i].toUpperCase()}:*\n\n`
    c.forEach(c => {
      message += `*${c.command}* - _${c.description}_\n${c.alternatives.length ? '<' + prefix + c.alternatives.join(' ' + prefix) + '>' : ''}\n\n`.replace(prefix + '.', '.')
    })
    message += '\n'
  })

  // remove the last \n
  message = message.trim().replace(/\n$/, '').trim()
  // await msg.reply(JSON.stringify(msg.aux, null, 2))
  await msg.reply(message)
}

//
// ================================== Helper Functions ==================================
//
function secondsToDhms (seconds) {
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor(seconds % (3600 * 24) / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  const s = Math.floor(seconds % 60)
  return `${d}:${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}
