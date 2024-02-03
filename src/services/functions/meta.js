import { getDBUrl, getToken, forceContactUpdate } from '../../db.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import spintax from '../../utils/spintax.js'
import { textSticker } from './stickers.js'
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

//
// ================================== Helper Functions ==================================
//
