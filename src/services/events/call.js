import { getLags } from '../../utils/lagMemory.js'
import spintax from '../../utils/spintax.js'
import { getClient } from '../../spawn.js'
import logger from '../../logger.js'

// user is key, value is an object with the time of the warning and the number of warnings
const warnings = {}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const ownerId = '553492003909@c.us'

/**
 * Emitted when a call is received
 * @param {import('whatsapp-web.js').Call} call
 * https://docs.wwebjs.dev/Client.html#event:incoming_call
 */

export default async (call) => {
  const emoji = '📞'
  logger.info(`${emoji} - Incoming call`, call)

  await call.reject()
  if (call.isGroup) return // Ignore group calls

  const client = getClient()

  const lagsLastHour = getLags(60)
  const lastMinuteLag = lagsLastHour[lagsLastHour.length - 1]

  if (call.from === ownerId) {
    return await client.sendMessage(call.from, JSON.stringify(lagsLastHour, null, 2))
  }

  const currentLag = lastMinuteLag?.averageLag || 0
  if (currentLag >= 10) {
    const message = `🚨 - O {bot|DeadByte|Dead} {está|tá|ta} {com um lag|uma lentidão} de ${currentLag} segundos para receber as mensagens do WhatsApp\n\n{Estou|To|Tô} {ciente|ligado} e tentando resolver {o|esse|este} problema, por favor, pare de ligar para o bot!!!`
    await client.sendMessage(call.from, spintax(message))
  }

  if (!warnings[call.from]) {
    warnings[call.from] = {
      time: Date.now(),
      count: 1
    }
    console.log(warnings)
    let message = '⚠️ - '
    message += '{Por favor, não ligue|Por favor, evite ligar|Peço que não ligue} para o bot!\n'
    message += 'Se {você ligou por|se foi} engano, {irei|vou} {relevar|deixar passar} {desta|dessa} vez, '
    message += '{mas|porém} {da|na} próxima vez, você {será bloqueado(a)|levará block}!'
    return await client.sendMessage(call.from, spintax(message))
  }

  if (warnings[call.from].count === 1) {
    warnings[call.from].count++
    let message = '🚨 - '
    message += '{{Já|Eu já} {te|lhe} avisei uma vez|Você já foi avisado(a)|Mais uma vez}, não ligue para o bot!!!\n'
    message += '\n{{Este|Esse} é o seu *último aviso*|Essa é a sua *última chance*}, {da próxima vez|na próxima|se ligar novamente} *você {será bloqueado|levará block}*!'
    return await client.sendMessage(call.from, spintax(message))
  }

  if (warnings[call.from].count === 2) {
    warnings[call.from].count++
    let message = '🚫 - '
    message += '{Atenção! |}Você {foi *bloqueado*|levou um *block*}!\n'
    message += '{Se|Caso} você {acha|acredita|acredite} que {foi {um|algum}|tenha ocorrido algum} {erro|engano|equívoco} '
    message += 'entre em contato com o desenvolvedor do bot no grupo:\n\nhttps://chat.whatsapp.com/CBlkOiMj4fM3tJoFeu2WpR'
    await client.sendMessage(call.from, spintax(message))
    await wait(5000) // wait 5 seconds to garantee the message is sent before blocking

    warnings[call.from] = undefined // remove from warnings
    const contact = await client.getContactById(call.from)
    await contact.block()
  }
}
