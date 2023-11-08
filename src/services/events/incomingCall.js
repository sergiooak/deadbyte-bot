import logger from '../../logger.js'
import { getClient } from '../../index.js'

// user is key, value is an object with the time of the warning and the number of warnings
const warnings = {}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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
  // Save the warning and the time of the warning
  // On the first just give a friendly warning, it could be a mistake
  // On the second be more serious, it could be a mistake, and warn that the next time the user will be blocked
  // On the third block the user

  if (!warnings[call.from]) {
    warnings[call.from] = {
      time: Date.now(),
      count: 1
    }
    return await client.sendMessage(call.from, '🚫 - Por favor, não ligue para o bot, desculpe se você ligou por engano, irei relevar desta vez, mas da próxima vez você será bloqueado!')
  }

  if (warnings[call.from].count === 1) {
    warnings[call.from].count++
    return await client.sendMessage(call.from, '🚫 - Já te avisei uma vez, não ligue para o bot!!!\nEste é o seu *último aviso*, da próxima vez *você será bloqueado*!')
  }

  if (warnings[call.from].count === 2) {
    warnings[call.from].count++
    await client.sendMessage(call.from, '🚫 - Você foi bloqueado por ligar para o bot, se você acha que foi um engano, entre em contato com o desenvolvedor do bot.')
    await wait(5000) // wait 5 seconds to garantee the message is sent before blocking
    const contact = await client.getContactById(call.from)
    await contact.block()
  }
}
