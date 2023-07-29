import spintax from '../../utils/spintax.js'
import fetch from 'node-fetch'

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

  const saudation = '{🤖|👋|💀🤖}  - {Olá|Oi|Oie|E aí|Oi tudo bem?}!'
  const part1 = '{Eu estou|Estou|O bot {está|ta|tá}|O DeadByte {está|ta|tá}} {online|on|ligado}{ direto|} {a|á|tem}{:|}'
  let daysPart = parseInt(days) > 0 ? `${days} {dias|d}` : ''
  if (parseInt(days) === 1) daysPart = daysPart.replace('dias', 'dia')
  const hoursPart = `{${hours}|${parseInt(hours)}} {horas|h}`
  const minutesPart = `{${minutes}|${parseInt(minutes)}} {minutos|min|m}`
  const secondsPart = `{ e {${seconds}|${parseInt(seconds)}} {segundos|s}|}`

  const clock = '{⏳|⌚|⏰|⏱️|⏲️|🕰️|🕛|🕧|🕐|🕜|🕑|🕝}'
  await msg.react(spintax(clock)) // react with random clock emoji

  const message = spintax(`${saudation}\n\n${part1}\n*${daysPart} ${hoursPart} ${minutesPart}${secondsPart}*`)
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
