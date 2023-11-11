import { getWaitTime, getQueueLength } from '../queue.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import reactions from '../../config/reactions.js'
import { createUrl } from '../../config/api.js'
import spintax from '../../utils/spintax.js'
import { getDBUrl, getBot, getToken } from '../../db.js'
import logger from '../../logger.js'
import FormData from 'form-data'
import 'dayjs/locale/pt-br.js'
import fetch from 'node-fetch'
import mime from 'mime-types'
import sharp from 'sharp'
import dayjs from 'dayjs'
import qs from 'qs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

const dbUrl = getDBUrl()
const token = getToken()

//
// ================================ Main Functions =================================
//
/**
 * Returns general statistics
 * @param {wwebjs.Message} msg
 */
export async function stats (msg) {
  await msg.react(reactions.wait)

  let saudation = 'Bom dia'
  const hour = dayjs().hour()
  if (hour >= 12 && hour < 18) {
    saudation = 'Boa tarde'
  } else if (hour >= 18 || hour < 5) {
    saudation = 'Boa noite'
  }

  let initialMessage = `{⏳|⌛|🕰️|🕛|🕒|🕞} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!\n\n`
  initialMessage += '{Espere|Espera|Péra} um {pouco|pouquinho|momento|segundo} enquanto eu {pego|busco|procuro} as {suas |}estatísticas...'
  let reply = null
  if (!msg.aux.chat.isGroup) {
    reply = await msg.reply(spintax(initialMessage))
  }
  const startedAt = Date.now()

  // const botID = getBot()
  const contactID = msg.aux.db.contact.id
  const query = qs.stringify({
    contact: contactID
  }, {
    encodeValuesOnly: true // prettify URL
  })
  const response = await fetch(`${dbUrl}/actions/stats/new?${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })
  const stats = await response.json()
  const emojiMessage = '{📊|📈|📉|🔍|🔬|📚}'
  let message = `${emojiMessage} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!\n\n`
  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'
  message += `{Você|Tu|Vc} já {usou|utilizou|executou|acessou|interagiu com|solicitou serviços do} o bot *${stats.total.toLocaleString('pt-BR')}* {vezes|ocasiões|momentos}!\n`
  message += `A primeira vez foi ${dayjs(stats.first).fromNow()} em *${dayjs(stats.first).format('DD/MM/YYYY')}* ás *${dayjs(stats.first).format('HH:mm:ss')}*.\n\n`

  const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
  const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
  message += `{Você|Tu|Vc} {já |}{criou|fez} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {suas interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas}!\n\n`

  // inside every commands the is a commands array, make a single array with all commands
  const commands = stats.commands.reduce((acc, command) => {
    return acc.concat(command.commands)
  }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

  const mostUsedCommand = commands[0]
  const mostUsedCommandCharLength = mostUsedCommand.total.toString().length

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  message += `*Você já usou ${commands.length} comandos diferentes:*\n\n`

  const prefix = msg.aux.prefix || '!'
  message += commands.map(command => {
    let string = ''
    string += '```'
    // string += `*!${command.alternatives[0]}* - ${command.total.toLocaleString('pt-BR')}`
    string += rPad(`${prefix}${command.alternatives[0]}`, 29 - mostUsedCommandCharLength)
    string += lPad(command.total, mostUsedCommandCharLength)
    string += '```'
    return string
  }).join('\n')

  // garantee that at least 1.5 seconds have passed
  while (Date.now() - startedAt < 1500) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  await msg.react(spintax(emojiMessage))
  if (reply) { return await reply.edit(spintax(message)) }
  await msg.reply(spintax(message))
}

/**
 * Returns full statistics
 * @param {wwebjs.Message} msg
 */
export async function fullStats (msg) {
  await msg.reply('Dummy text for fullStats function')
}

/**
 * Returns statistics for the week
 * @param {wwebjs.Message} msg
 */
export async function weekStats (msg) {
  await msg.reply('Dummy text for weekStats function')
}

/**
 * Returns statistics for the hour
 * @param {wwebjs.Message} msg
 */
export async function hourStats (msg) {
  await msg.reply('Dummy text for hourStats function')
}
//
// ================================== Helper Functions ==================================
//

/**
 * Make the string have a fixed length by adding a char to the left
 * @param {*} string
 * @param {*} length
 * @param {*} char
 * @returns
 */
function lPad (string, length, char = '0') {
  string = string.toString()
  if (string.length >= length) return string
  return char.repeat(length - string.length) + string
}

/**
 * Make the string have a fixed length by adding a char to the right
 * @param {*} string
 * @param {*} length
 * @param {*} char
 * @returns
 */
function rPad (string, length, char = '.') {
  string = string.toString()
  if (string.length >= length) return string
  return string + ' ' + char.repeat(length - string.length - 2) + ' '
}
