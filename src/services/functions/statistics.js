import relativeTime from 'dayjs/plugin/relativeTime.js'
import reactions from '../../config/reactions.js'
import { getDBUrl, getToken } from '../../db.js'
import spintax from '../../utils/spintax.js'
import 'dayjs/locale/pt-br.js'
import fetch from 'node-fetch'
import dayjs from 'dayjs'
import qs from 'qs'
//
// ================================ Variables =================================
//
dayjs.locale('pt-br')
dayjs.extend(relativeTime)

const dbUrl = getDBUrl()
const token = getToken()
const minWaitTime = 1_500
//
// ================================ Main Functions =================================
//
/**
 * Returns general statistics
 * @param {wwebjs.Message} msg
 */
export async function stats (msg) {
  await msg.react(reactions.wait)
  const { saudation, startedAt, reply } = await sendInitialReply(msg, '')

  const contactID = msg.aux.db.contact.id
  const stats = await fetchStats(contactID)

  const emojis = '{📊|📈|📉|🔍|🔬|📚}'
  let message = `${emojis} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!\n\n`
  // 📊 - Olá, Sergio Carvalho!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  message += `{Você|Tu|Vc} já {usou|utilizou|executou|acessou|interagiu com} o {bot|Dead|DeadByte} *${stats.total.toLocaleString('pt-BR')}* vezes!\n`
  // Você já usou o bot *100* vezes!

  message += `{{A|Sua} primeira vez|Seu primeiro uso} foi ${dayjs(stats.first).fromNow()} {em|no dia} *${dayjs(stats.first).format('DD/MM/YYYY')}* {ás|às|as} *${dayjs(stats.first).format('HH:mm:ss')}*.\n\n`
  // Sua primeira vez foi há 2 dias em 01/01/2021 às 12:00:00

  const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
  const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
  message += `{Você|Tu|Vc} {já |}{criou|fez} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {suas interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas}!\n\n`
  // Você já criou 100 figurinhas!
  // 10% do total de suas interações com o bot!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  const commands = stats.commands.reduce((acc, command) => {
    return acc.concat(command.commands)
  }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

  message += `*{Você|Tu|Vc} já {usou|utilizou|executou|acessou} ${commands.length} {comandos|funções} diferentes:*\n\n`
  // Você já usou 100 comandos diferentes:

  message = formatCommands(commands, msg, message)

  await waitForMinimumTime(startedAt)
  await reactAndReply(msg, emojis, reply, message)
}

/**
 * Returns bot statistics
 * @param {wwebjs.Message} msg
 */
export async function botStats (msg) {
  await msg.react(reactions.wait)
  const { saudation, startedAt, reply } = await sendInitialReply(msg, 'desse numero do bot')

  const stats = await fetchStats()

  const emojis = '{🤖|👾|💀}'
  let message = `${emojis} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!`
  // 🤖 - Olá, Sergio Carvalho!

  message += '\n\n```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  message += `O {bot|Dead|DeadByte} já {foi usado|foi utilizado} *${stats.total.toLocaleString('pt-BR')}* vezes!\nPor *${stats.users.toLocaleString('pt-BR')}* {usuários|pessoas} diferentes!\n\n`
  // O bot com o nome *DeadByte* e o número *+55 11 99999-9999* já foi usado *100* vezes!

  message += `{{A|Sua} primeira vez|Seu primeiro uso} foi ${dayjs(stats.first).fromNow()} {em|no dia} *${dayjs(stats.first).format('DD/MM/YYYY')}* {ás|às|as} *${dayjs(stats.first).format('HH:mm:ss')}*.\n\n`
  // Sua primeira vez foi há 2 dias em 01/01/2021 às 12:00:00

  const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
  const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
  message += `{Já foram criadas|Foram criadas|Já foram feitas|Foram feitas} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas}!`
  // Já foram criadas 100 figurinhas!
  // 10% do total de interações com o bot!

  message += '\n\n```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  const commands = stats.commands.reduce((acc, command) => {
    return acc.concat(command.commands)
  }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

  message += `*{Já foram usados|Foram utilizados|Já foram executados|Foram acessados} ${commands.length} {comandos|funções} diferentes:*\n\n`
  // Já foram usados 100 comandos diferentes:

  message = formatCommands(commands, msg, message)

  const siteEmojis = '{🌐|🌍|🌎|🌏}'
  message += '\n\n```━━━━━━━━━━ ' + siteEmojis + ' ━━━━━━━━━━```\n\n' // divider

  message += 'Veja as estatísticas completas em tempo real no site:\ndeadbyte.com.br/stats\n\n'

  await waitForMinimumTime(startedAt)
  await reactAndReply(msg, emojis, reply, message)
}

/**
 * Returns statistics for the week
 * @param {wwebjs.Message} msg
 */
export async function weekStats (msg) {
  await msg.react(reactions.wait)
  const { saudation, startedAt, reply } = await sendInitialReply(msg, 'da semana')

  const contactID = msg.aux.db.contact.id
  const stats = await fetchStats(contactID, 'week')

  const emojis = '{📊|📈|📉|🔍|🔬|📚}'
  let message = `${emojis} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!\n\n`
  // 📊 - Olá, Sergio Carvalho!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  message += `Nessa última semana {você|tu|vc} já {usou|utilizou|executou|acessou|interagiu com} o {bot|Dead|DeadByte} *${stats.total.toLocaleString('pt-BR')}* vezes!\n`
  // Nessa última semana você já usou o bot *100* vezes!

  message += `{A primeira vez} foi no dia *${dayjs(stats.first).format('DD/MM/YYYY')}* {ás|às|as} *${dayjs(stats.first).format('HH:mm:ss')}*.\n\n`
  // A primeira vez foi em 01/01/2021 às 12:00:00

  const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
  const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
  message += `{Você|Tu|Vc} {criou|fez} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {suas interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas} essa semana!\n\n`
  // Você criou 100 figurinhas!
  // 10% do total de suas interações com o bot dessa semana!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  const commands = stats.commands.reduce((acc, command) => {
    return acc.concat(command.commands)
  }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

  message += `*{Você|Tu|Vc} {usou|utilizou|executou|acessou} ${commands.length} {comandos|funções} diferentes:*\n\n`
  // Você usou 100 comandos diferentes:

  message = formatCommands(commands, msg, message)

  await waitForMinimumTime(startedAt)
  await reactAndReply(msg, emojis, reply, message)
}

/**
 * Returns statistics for the day
 * @param {wwebjs.Message} msg
 */
export async function dayStats (msg) {
  await msg.react(reactions.wait)
  const { saudation, startedAt, reply } = await sendInitialReply(msg, 'do dia')

  const contactID = msg.aux.db.contact.id
  const stats = await fetchStats(contactID, 'day')

  const emojis = '{📊|📈|📉|🔍|🔬|📚}'
  let message = `${emojis} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!\n\n`
  // 📊 - Olá, Sergio Carvalho!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  message += `Nas últimas 24 horas {você|tu|vc} já {usou|utilizou|executou|acessou|interagiu com} o {bot|Dead|DeadByte} *${stats.total.toLocaleString('pt-BR')}* vezes!\n`
  // Nas últimas 24 horas você já usou o bot *100* vezes!

  message += `{A primeira vez} foi {em|no dia} *${dayjs(stats.first).format('DD/MM/YYYY')}* {ás|às|as} *${dayjs(stats.first).format('HH:mm:ss')}*.\n\n`
  // A primeira vez foi em 01/01/2021 às 12:00:00

  const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
  const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
  message += `{Você|Tu|Vc} {criou|fez} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {suas interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas} nas últimas 24 horas!\n\n`
  // Você criou 100 figurinhas!
  // 10% do total de suas interações com o bot nas últimas 24 horas!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  const commands = stats.commands.reduce((acc, command) => {
    return acc.concat(command.commands)
  }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

  message += `*{Você|Tu|Vc} {usou|utilizou|executou|acessou} ${commands.length} {comandos|funções} diferentes:*\n\n`
  // Você usou 100 comandos diferentes:

  message = formatCommands(commands, msg, message)

  await waitForMinimumTime(startedAt)
  await reactAndReply(msg, emojis, reply, message)
}

/**
 * Returns statistics for the hour
 * @param {wwebjs.Message} msg
 */
export async function hourStats (msg) {
  await msg.react(reactions.wait)
  const { saudation, startedAt, reply } = await sendInitialReply(msg, 'da última hora')

  const contactID = msg.aux.db.contact.id
  const stats = await fetchStats(contactID, 'hour')

  const emojis = '{📊|📈|📉|🔍|🔬|📚}'
  let message = `${emojis} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!\n\n`
  // 📊 - Olá, Sergio Carvalho!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  message += `Nessa última hora {você|tu|vc} já {usou|utilizou|executou|acessou|interagiu com} o {bot|Dead|DeadByte} *${stats.total.toLocaleString('pt-BR')}* vezes!\n`
  // Nessa última hora você já usou o bot *100* vezes!

  const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
  const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
  message += `{Você|Tu|Vc} {criou|fez} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {suas interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas} nessa última hora!\n\n`
  // Você criou 100 figurinhas!
  // 10% do total de suas interações com o bot nessa última hora!

  message += '```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  const commands = stats.commands.reduce((acc, command) => {
    return acc.concat(command.commands)
  }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

  message += `*{Você|Tu|Vc} {usou|utilizou|executou|acessou} ${commands.length} {comandos|funções} diferentes:*\n\n`
  // Você usou 100 comandos diferentes:

  message = formatCommands(commands, msg, message)

  await waitForMinimumTime(startedAt)
  await reactAndReply(msg, emojis, reply, message)
}
//
// ================================== Helper Functions ==================================
//
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

/**
 * Get the saudation according to the time
 * @returns {string}
 */
function getSaudation () {
  let saudation = 'Bom dia'
  const hour = dayjs().hour()
  if (hour >= 12 && hour < 18) {
    saudation = 'Boa tarde'
  } else if (hour >= 18 || hour < 5) {
    saudation = 'Boa noite'
  }
  return saudation
}

/**
 * Wait for a minimum time to prevent flood
 * @param {number} startedAt
 */
async function waitForMinimumTime (startedAt) {
  while (Date.now() - startedAt < minWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * React to the message and reply
 * @param {wwebjs.Message} msg
 * @param {string} emojis
 * @param {wwebjs.Message} reply
 * @param {string} message
 */
async function reactAndReply (msg, emojis, reply, message) {
  await msg.react(spintax(emojis))
  if (reply) { return await reply.edit(spintax(message)) }
  await msg.reply(spintax(message))
}

/**
 * Fetch statistics from the API
 * @param {string} contact
 * @param {string} mode
 * @param {string} bot
 * @returns {Promise}
 */
export async function fetchStats (contact = undefined, mode = undefined, bot = undefined) {
  const query = qs.stringify({
    contact,
    bot,
    mode
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
  return stats
}

/**
 * Send the initial reply
 * @param {wwebjs.Message} msg
 * @param {string} sufix
 * @returns {Promise}
 */
async function sendInitialReply (msg, sufix) {
  const saudation = getSaudation()
  let initialMessage = `{⏳|⌛|🕰️|🕛|🕒|🕞} - {Olá|Oi|Oie|${saudation}} ${msg.aux.sender.pushname}!\n\n`
  // ⏳ - Olá, Sergio Carvalho!
  initialMessage += `{Espere|Espera|Péra} um {pouco|pouquinho|momento|segundo} enquanto eu {pego|busco|procuro} as {suas |}estatísticas${sufix ? ' ' + sufix : ''}...`
  // Espere um pouco enquanto eu pego as suas estatísticas...
  let reply = null
  if (!msg.aux.chat.isGroup) {
    reply = await msg.reply(spintax(initialMessage))
  }
  const startedAt = Date.now()
  return { saudation, startedAt, reply }
}

/**
 * Format the commands to a string
 * @param {array} commands
 * @param {wwebjs.Message} msg
 * @param {string} message
 * @returns {string}
 */
export function formatCommands (commands, msg, message, mode = 'full') {
  const prefix = msg?.aux.prefix || '!'

  if (mode === 'full') {
  // !s ....................... 98
  // !ttp ...................... 9
  // !ly ....................... 5
  // !roubar ................... 4
  // !menu ..................... 2
  // !reacao ................... 1
  // !ping ..................... 1
    message += commands.map(command => {
      let string = ''
      string += '```'
      // string += `*!${command.alternatives[0]}* - ${command.total.toLocaleString('pt-BR')}`
      string += rPad(`${prefix}${command.alternatives[0]}`, 29 - command.total.toString().length)
      string += command.total
      string += '```'
      // .sticker ......... 100
      return string
    }).join('\n')
    return message
  }

  // !s (98), !ttp (9), !ly (5)
  message += commands.map(command => {
    let string = ''
    string += `${prefix}${command.alternatives[0]} (${command.total.toLocaleString('pt-BR')})`
    return string
  }).join(', ')

  return message
}
