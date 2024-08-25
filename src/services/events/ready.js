import { saveActionToDB, getBot, findCurrentBot } from '../../db.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import importFresh from '../../utils/importFresh.js'
import spintax from '../../utils/spintax.js'
import { getClient } from '../../spawn.js'
import { addToQueue } from '../queue.js'
import logger from '../../logger.js'
import 'dayjs/locale/pt-br.js'
import cron from 'node-cron'
import dayjs from 'dayjs'
//
// ================================ Variables =================================
//
dayjs.locale('pt-br')
dayjs.extend(relativeTime)

const logsGroup = '120363218197884593@g.us'
const stickerGroup = '120363282791987363@g.us'
//
// ================================ Main Functions =================================
//
/**
 * Emitted when the client has initialized and is ready to receive messages.
 * @see https://docs.wwebjs.dev/Client.html#event:ready
 */
export default async () => {
  logger.info('Client is ready!')

  const client = getClient()
  await findCurrentBot(client)

  // const chats = await client.getChats()
  // handleUnreadMessages(chats)

  cron.schedule('* * * * *', async () => { // every minute
    await client.sendPresenceAvailable()
  })

  // every 15 minutes if bot is on sticker group send Trending Stickers
  // except if between 00:00 and 06:00
  cron.schedule('*/15 * * * *', async () => {
    const now = dayjs()
    const isBetweenMidnightAnd6 = now.isAfter(now.startOf('day')) && now.isBefore(now.startOf('day').add(6, 'hour'))
    if (isBetweenMidnightAnd6) return

    const client = getClient()
    const chat = await client.getChatById(stickerGroup)
    const isOnGroup = !!chat.participants.length
    if (isOnGroup) {
      const stickerFunctions = await importFresh('services/functions/stickers.js')
      stickerFunctions.stickerLyTrending(null, chat)
    }
  })

  // Every hour, at minute 59, send hourly stats to logs group
  cron.schedule('59 * * * *', async () => { // every end of hour
    const client = getClient()
    const chat = await client.getChatById(logsGroup)
    const isOnGroup = !!chat.participants.length
    if (isOnGroup) {
      await sendHourlyStats(client)
    }
  })

  // Every day at 22:00 send daily stats to logs group
  cron.schedule('00 22 * * *', async () => { // every day at 22:00
    const client = getClient()
    const chat = await client.getChatById(logsGroup)
    const isOnGroup = !!chat.participants.length
    if (isOnGroup) {
      await sendDailyStats(client)
    }
  })
}
//
// ================================== Helper Functions ==================================
//
// async function handleUnreadMessages (chats) {
//   for await (const chat of chats) {
//     const unreadMessages = await chat.fetchMessages({ limit: 10 })
//     await wait(2_500) // wait 250ms to prevent flood
//     let unreadMessagesCount = 0
//     let hasRevokedMessages = false
//     for (const msg of unreadMessages.reverse()) { // reverse to get the earliest messages first
//       if (msg.fromMe) {
//         break // if message is from me, don't parse any more from this chat
//       }

//       if (msg.type.toUpperCase() === 'REVOKED') {
//         hasRevokedMessages = true
//         msg.react('🚮')
//       }
//       const messageParser = await importFresh('validators/message.js')
//       const command = await messageParser.default(msg)
//       if (command) {
//         logger.info(`📥 - [${msg.from.split('@')[0]} - ${command.type}.${command.command}()`)
//         msg.aux.db = await saveActionToDB(command.type, command.command, msg)
//         addToQueue(msg.from, command.type, command.command, msg)
//       }
//       unreadMessagesCount++
//     }

//     if (unreadMessagesCount !== 0) {
//       logger.info(`📥 - [${chat.name}] - ${unreadMessagesCount} unread messages`)

//       // this means that user has deleted before the bot could read it
//       if (hasRevokedMessages) {
//         const saudation = '{🤖|👋|💀🤖}  - {Olá|Oi|Oie|E aí|Oi tudo bem?}!'
//         const part1 = '{Se|Caso|Se caso} {você|voce|vc} {não|ñ|nao} tivesse {apagado|deletado|removido|excluído}'
//         const part2 = 'as mensagens {eu|o bot|o DeadByte} {tava|estava|estaria|taria} te {respondendo|mandando} agora!'
//         const laugh = '{kk|rsrs|hehe|kkk|🤣|haha}'

//         const message = spintax(`${saudation} ${part1} ${part2} ${laugh}`)

//         chat.sendMessage(message)
//       }
//     }

//     await chat.sendSeen()
//   }
// }

// async function wait (ms) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms)
//   })
// }

/**
 * Send hourly stats to logs group
 * @param {import('whatsapp-web.js').Client} client
 */
async function sendHourlyStats (client) {
  const statistics = await importFresh('services/functions/statistics.js')
  const { fetchStats, formatCommands } = statistics
  try {
    const botID = getBot()
    const stats = await fetchStats(undefined, 'hour', botID)

    let message = ''

    const usersEmoji = '{👤|👥}'
    message += `${usersEmoji} ${stats.users.toLocaleString('pt-BR')} usuários\n`
    // 👥 50 usuários

    const commands = stats.commands.reduce((acc, command) => {
      return acc.concat(command.commands)
    }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)
    const usageEmoji = '{📈|📉|📊|🔍|🔬|📚}'
    message += `${usageEmoji} ${commands.length.toLocaleString('pt-BR')} comandos\n`
    // 📈 100 comandos

    const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
    const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
    message += `📊 Figurinhas: ${totalStickers.toLocaleString('pt-BR')}${totalStickers ? ' (' + stickersPercent + '% do total)' : ''} \n\n`
    // 📊 Figurinhas: 100 (10% do total)

    message = `${formatCommands(commands, null, message, 'inline')}`
    // 📝 Comandos: !comando1 (20), !comando2 (10),!comando3 (5),

    const chat = await client.getChatById(logsGroup)
    await chat.sendMessage(spintax(message))
  } catch (err) {
    logger.error(err)
  }
}

async function sendDailyStats (client) {
  const statistics = await importFresh('services/functions/statistics.js')
  const { fetchStats, formatCommands } = statistics
  try {
    const botID = getBot()
    const stats = await fetchStats(undefined, 'day', botID)

    let message = ''
    message += `*Estatísticas do dia ${dayjs().format('DD/MM/YYYY')}*\n\n`
    const usersEmoji = '{👤|👥}'
    message += `${usersEmoji} ${stats.users.toLocaleString('pt-BR')} usuários\n`
    // 👥 50 usuários

    const commands = stats.commands.reduce((acc, command) => {
      return acc.concat(command.commands)
    }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)
    const usageEmoji = '{📈|📉|📊|🔍|🔬|📚}'
    message += `${usageEmoji} ${commands.length.toLocaleString('pt-BR')} comandos\n`
    // 📈 100 comandos

    const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
    const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
    message += `📊 Figurinhas: ${totalStickers.toLocaleString('pt-BR')}${totalStickers ? ' (' + stickersPercent + '% do total)' : ''} \n\n`
    // 📊 Figurinhas: 100 (10% do total)

    message = `${formatCommands(commands, null, message, 'inline')}`
    // 📝 Comandos: !comando1 (20), !comando2 (10),!comando3 (5),

    const chat = await client.getChatById(logsGroup)
    await chat.sendMessage(spintax(message))

    // sendDailyStatsToAnnounceGroup(client)
  } catch (err) {
    logger.error(err)
  }
}

async function sendDailyStatsToAnnounceGroup (client) {
  const announceGroup = '120363094244463491@g.us'
  const chat = await client.getChatById(announceGroup)
  const admins = chat.participants.filter(p => p.isAdmin || p.isSuperAdmin).map((p) => p.id._serialized)
  const botIsAdmin = admins.includes(client.info.wid._serialized
    ? client.info.wid._serialized
    : client.info.wid)

  if (!botIsAdmin) return

  const statistics = await importFresh('services/functions/statistics.js')
  const { fetchStats, formatCommands } = statistics

  const stats = await fetchStats(undefined, 'day')

  let message = `Nas últimas 24 horas o {bot|Dead|DeadByte} {foi usado|foi utilizado} *${stats.total.toLocaleString('pt-BR')}* vezes!\nPor *${stats.users.toLocaleString('pt-BR')}* {usuários|pessoas} diferentes!\n\n`
  // O bot com o nome *DeadByte* e o número *+55 11 99999-9999* foi usado *100* vezes!

  const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
  const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
  message += `Foram {criadas|feitas} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas} nas últimas 24 horas!!`
  // Foram criadas 100 figurinhas!
  // 10% do total de interações com o bot!

  message += '\n\n```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

  const commands = stats.commands.reduce((acc, command) => {
    return acc.concat(command.commands)
  }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

  message += `*{Foram usados|Foram utilizados|Foram executados} ${commands.length} {comandos|funções} diferentes:*\n\n`
  // Foram usados 100 comandos diferentes:

  message = formatCommands(commands, null, message)

  // const siteEmojis = '{🌐|🌍|🌎|🌏}'
  // message += '\n\n```━━━━━━━━━━ ' + siteEmojis + ' ━━━━━━━━━━```\n\n' // divider

  // message += 'Veja as estatísticas completas em tempo real no site:\ndeadbyte.com.br/stats\n\n'

  await chat.sendMessage(spintax(message))
}
