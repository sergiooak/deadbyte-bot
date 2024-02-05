import logger from '../../logger.js'
import { getSocket } from '../../index.js'
import spintax from '../../utils/spintax.js'

// user is key, value is an object with the time of the warning and the number of warnings
const warnings = {}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Receive an update on a call, including when the call was received, rejected, accepted
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['call']} event
 */
export default async (event) => {
  const emoji = '📞'
  const call = event[0]
  if (call.status === 'offer') {
    logger.info(`${emoji} - Incoming call\n` + JSON.stringify(call, null, 2))
    const sock = getSocket()
    await sock.rejectCall(call.id, call.from)

    if (call.isGroup) return // Ignore group calls

    if (!warnings[call.from]) {
      warnings[call.from] = {
        time: Date.now(),
        count: 1
      }
      let message = '⚠️ - '
      message += '{Por favor, não ligue|Por favor, evite ligar|Peço que não ligue} para o bot!\n'
      message += ' {Desculpe|Peço desculpas} se {você ligou por|se foi} engano, {irei|vou} {relevar|deixar passar|não irei fazer nada} {desta|dessa} vez, '
      message += '{mas|porém} {da|na} próxima vez, você {será bloqueado(a)|levará block}!'
      return await sock.sendMessage(call.from, { text: spintax(message) })
    }

    if (warnings[call.from].count === 1) {
      warnings[call.from].count++
      let message = '🚨 - '
      message += '{{Já|Eu já} {te|lhe} avisei uma vez|Você já foi avisado(a)|Mais uma vez}, não ligue para o bot!!!\n'
      message += '\n{{Este|Esse} é o seu *último aviso*|Essa é a sua *última chance*}, {da próxima vez|na próxima|se ligar novamente} *você {será bloqueado|levará block}*!'
      return await sock.sendMessage(call.from, { text: spintax(message) })
    }

    if (warnings[call.from].count === 2) {
      warnings[call.from].count++
      let message = '🚫 - '
      message += '{Atenção!|Você} {foi *bloqueado*|levou um *block*}!\n'
      message += '{Se|Caso} você {acha|acredita|acredite} que {foi {um|algum}|tenha ocorrido algum} {erro|engano|equívoco} '
      message += 'entre em contato com o desenvolvedor do bot'
      await sock.sendMessage(call.from, { text: spintax(message) })
      await wait(5000) // wait 5 seconds to garantee the message is sent before blocking

      warnings[call.from] = undefined // remove from warnings
      await sock.updateBlockStatus(call.from, 'block')
    }
  }
}
