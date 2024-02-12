import { getDBUrl, getToken, forceContactUpdate } from '../../db.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import spintax from '../../utils/spintax.js'
import { textSticker } from './stickers.js'
import 'dayjs/locale/pt-br.js'
import dayjs from 'dayjs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

const obfuscateMap = [
  'a', 'D', 'e', 'A', 'd', 'F', 'g', 'H', 'i', 'J', 'k', 'L', 'm', 'N', 'o', 'P',
  'q', 'R', 'S', 't', 'u', 'V', 'w', 'X', 'y', 'Z', 'B', 'Y', 'T', 'E', 'c', 'C'
]

//
// ================================ Main Functions =================================
//
/**
 * Send the menu
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function set (msg) {
  await msg.react('⚙️')

  const preferences = {
    pack: 'stickerName',
    pacote: 'stickerName',
    author: 'stickerAuthor',
    autor: 'stickerAuthor',
    nome: 'stickerAuthor',
    name: 'stickerAuthor'
  }

  const examples = {
    pacote: 'DeadByte.com.br',
    nome: 'bot de figurinhas'
  }

  const avaliablePreferences = Object.keys(preferences)
  const examplesPrefences = Object.keys(examples)

  const prefence = msg.body.split(' ')[0]
  const value = msg.body.split(' ').slice(1).join(' ')

  if (!prefence) {
    let message = '❌ - Para usar este comando você deve informar *o que* '
    message += 'você está definindo e *o valor* que você quer definir\n\n'
    message += '*Exemplos:*'
    const mono = '```'
    for (const pref of examplesPrefences) {
      message += `\n${mono}${msg.aux.prefix}set ${pref} ${examples[pref]}${mono}`
    }
    return msg.reply(message)
  }

  if (!avaliablePreferences.includes(prefence)) {
    let message = '❌ - Preferência inválida\n\n'
    message += '*Preferências disponíveis:*'
    const mono = '```'
    for (const pref of examplesPrefences) {
      message += `\n${mono}${pref}${mono}`
    }
    return msg.reply(message)
  }

  const id = msg.aux.db.contact.id
  const preferenceObject = msg.aux.db.contact.attributes.preferences ?? {}
  preferenceObject[preferences[prefence]] = value || 'undefined'
  // PUT /api/contacts/:id
  await fetch(`${getDBUrl()}/contacts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      data: {
        preferences: preferenceObject
      }
    })
  })
  msg.aux.db.contact = await forceContactUpdate(msg.contact)
  await msg.react('✅')
  msg.body = spintax('{Clique|Clica} {{nessa|nesta} figurinha|{nesse|neste} sticker} para {você |vc |}ver {{o que|oq} {mudou|alterou}|como ficou|o resultado}')
  await textSticker(msg)
}

export async function activate (msg) {
// msg.body = DeAdFR\n\nSe o dead não responder em até 1 minuto envie a mensagem novamente!\n\n Pra facilitar é só clicar no botão de novo: DeadByte.com.br/fila-de-acesso
// code = DeAdFR

  const code = msg.body.split('\n')[0].trim()
  const queueId = deobfuscateQueueId(code)
  if (queueId === false) {
    await msg.react('❌')
    return msg.reply('❌ - Código inválido')
  }

  // GET /api/queues/:id
  const response = await fetch(`${getDBUrl()}/queues/${queueId}?populate=*`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
  const queue = await response.json()
  if (queue.data.contact) {
    await msg.react('⚠️')
    return msg.reply('⚠️ - Código de ativação já utilizado')
  }

  console.log(msg.aux.db.contact.id)
  // PUT /api/queues/:id
  await fetch(`${getDBUrl()}/queues/${queueId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({
      data: {
        contact: msg.aux.db.contact.id
      }
    })
  })

  msg.aux.db.contact = await forceContactUpdate(msg.contact)
  await msg.react('⚡')
  await msg.reply(`⚡ - {Prontinho|Pronto|Tudo pronto} ${msg.pushname}{, o|!\n\nO|!!!\n\nO} {DeadByte|dead|bot} {{já esta|tá} ativo|{já foi|foi} ativado} {para você|pra vc|pra tu}{!|!!|!!!}`)
}

//
// ================================== Helper Functions ==================================
//
/**
 * Obfuscate a number to a string
 * @param {number} number
 * @returns {string}
 */
function obfuscateQueueId (number) {
  return parseInt(number).toString(16).padStart(6, '0').split('').map((char, index) => {
    const shift = (parseInt(char, 16) + index + 1) % obfuscateMap.length
    return obfuscateMap[shift]
  }).join('')
}

/**
 * Deobfuscate a string to a number
 * @param {string} encodedStr
 * @returns {number | boolean}
 */
function deobfuscateQueueId (encodedStr) {
  let foundInt
  try {
    // Check for invalid input
    if (!encodedStr.split('').every(char => obfuscateMap.includes(char))) {
      return 'Invalid input'
    }

    const hexStr = encodedStr.split('').map((char, index) => {
      let shift = obfuscateMap.indexOf(char) - (index + 1)
      while (shift < 0) {
        shift += obfuscateMap.length // Correct negative shift
      }
      return shift.toString(16)
    }).join('')

    foundInt = parseInt(hexStr, 16)
  } catch (error) {
    return false
  }
  return obfuscateQueueId(foundInt) === encodedStr ? foundInt : false
}
