import { fetchStats, formatCommands } from '../../services/functions/statistics.js'
import { saveActionToDB, getBot, findCurrentBot } from '../../db.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import importFresh from '../../utils/importFresh.js'
import spintax from '../../utils/spintax.js'
import { getClient } from '../../index.js'
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

const logsGroup = '120363197109329521@g.us'
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

  const chats = await client.getChats()
  handleUnreadMessages(chats)

  cron.schedule('* * * * *', async () => { // every minute
    await client.sendPresenceAvailable()
  })

  cron.schedule('59 * * * *', async () => { // every end of hour
    await sendHourlyStats(client)
  })

  cron.schedule('0 16 * * *', async () => { // every day at 22:00
    await sendDailyStats(client)
  })
}
//
// ================================== Helper Functions ==================================
//
async function handleUnreadMessages (chats) {
  for await (const chat of chats) {
    const unreadMessages = await chat.fetchMessages({ limit: 10 })
    await wait(2_500) // wait 250ms to prevent flood
    let unreadMessagesCount = 0
    let hasRevokedMessages = false
    for (const msg of unreadMessages.reverse()) { // reverse to get the earliest messages first
      if (msg.fromMe) {
        break // if message is from me, don't parse any more from this chat
      }

      if (msg.type.toUpperCase() === 'REVOKED') {
        hasRevokedMessages = true
        msg.react('🚮')
      }
      const messageParser = await importFresh('validators/message.js')
      const command = await messageParser.default(msg)
      if (command) {
        logger.info(`📥 - [${msg.from.split('@')[0]} - ${command.type}.${command.command}()`)
        msg.aux.db = await saveActionToDB(command.type, command.command, msg)
        addToQueue(msg.from, command.type, command.command, msg)
      }
      unreadMessagesCount++
    }

    if (unreadMessagesCount !== 0) {
      logger.info(`📥 - [${chat.name}] - ${unreadMessagesCount} unread messages`)

      // this means that user has deleted before the bot could read it
      if (hasRevokedMessages) {
        const saudation = '{🤖|👋|💀🤖}  - {Olá|Oi|Oie|E aí|Oi tudo bem?}!'
        const part1 = '{Se|Caso|Se caso} {você|voce|vc} {não|ñ|nao} tivesse {apagado|deletado|removido|excluído}'
        const part2 = 'as mensagens {eu|o bot|o DeadByte} {tava|estava|estaria|taria} te {respondendo|mandando} agora!'
        const laugh = '{kk|rsrs|hehe|kkk|🤣|haha}'

        const message = spintax(`${saudation} ${part1} ${part2} ${laugh}`)

        chat.sendMessage(message)
      }
    }

    await chat.sendSeen()
  }
}

async function wait (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Send hourly stats to logs group
 * @param {import('whatsapp-web.js').Client} client
 */
async function sendHourlyStats (client) {
  try {
    const botID = getBot()
    const stats = await fetchStats(undefined, 'hour', botID)

    const botInfo = client.info
    const botName = botInfo.pushname
    const botNumber = await client.getFormattedNumber(botInfo.wid.user)

    let message = ''

    message += `Nesta última hora o {bot|Dead|DeadByte} com o nome *"${botName}"* e o número *${botNumber}* já {foi usado|foi utilizado} *${stats.total.toLocaleString('pt-BR')}* vezes!\nPor *${stats.users.toLocaleString('pt-BR')}* {usuários|pessoas} diferentes!\n\n`
    // Nesta última hora o bot com o nome "DeadByte" e o número +55 11 99999-9999 já foi usado 100 vezes!
    // Por 10 usuários diferentes!

    message += `{{A|Sua} primeira vez|Seu primeiro uso} foi {ás|às|as} *${dayjs(stats.first).format('HH:mm:ss')}*.\n\n`
    // Sua primeira vez foi há 2 dias em 01/01/2021 às 12:00:00

    const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
    const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
    message += `{Foram criadas|Foram feitas} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas} nesta última hora!`
    // Foram criadas 100 figurinhas!
    // 10% do total de interações com o bot!

    message += '\n\n```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

    const commands = stats.commands.reduce((acc, command) => {
      return acc.concat(command.commands)
    }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

    message += `*{Foram usados|Foram utilizados|Foram executados|Foram acessados} ${commands.length} {comandos|funções} diferentes:*\n\n`
    // Foram usados 10 comandos diferentes:

    message = formatCommands(commands, null, message)

    const chat = await client.getChatById(logsGroup)
    await chat.sendMessage(message)
  } catch (err) {
    logger.error(err)
  }
}

async function sendDailyStats (client) {
  try {
    const botID = getBot()
    const stats = await fetchStats(undefined, 'day', botID)

    let message = ''

    message += `*Nas últimas 24 horas* eu {fui usado|fui utilizado} *${stats.total.toLocaleString('pt-BR')}* vezes!\nPor *${stats.users.toLocaleString('pt-BR')}* {usuários|pessoas} diferentes!\n\n`
    // Nas últimas 24 horas eu fui usado 100 vezes!
    // Por 10 usuários diferentes!

    const totalStickers = stats.commands.find(command => command.slug === 'stickers').total
    const stickersPercent = ((totalStickers / stats.total) * 100).toFixed(2).replace('.', ',')
    message += `{Foram criadas|Foram feitas} *${totalStickers.toLocaleString('pt-BR')} figurinhas*{!|!!|!!!}\n${stickersPercent}% do total de {interações com o {bot|Dead|DeadByte}|comandos executados|solicitações feitas|ações realizadas} nas últimas 24 horas!`
    // Foram criadas 100 figurinhas!
    // 10% do total de interações com o bot!

    message += '\n\n```━━━━━━━━━━ {📊|📈|📉|🔍|🔬|📚} ━━━━━━━━━━```\n\n'

    const commands = stats.commands.reduce((acc, command) => {
      return acc.concat(command.commands)
    }, []).filter(command => command.total > 0).sort((a, b) => b.total - a.total)

    message += `*{Foram usados|Foram utilizados|Foram executados|Foram acessados} ${commands.length} {comandos|funções} diferentes:*\n\n`

    message = formatCommands(commands, null, message)

    const chat = await client.getChatById(logsGroup)
    await chat.sendMessage(message)

    // TODO: send daily stats to anoucements group if current bot is admin of it
  } catch (err) {
    logger.error(err)
  }
}
