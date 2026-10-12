import { createError, eventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import type { BotApp } from '../../app/create-bot-app.js'
import { formatPairingCode, maskPhone, normalizePairingPhone } from '../../whatsapp/pairing.js'

const PairingBodySchema = z.object({
  phoneNumber: z.string().min(1)
})

function pairingView(app: BotApp) {
  const pairing = app.state.pairing
  if (!pairing) {
    return { active: false as const }
  }
  return {
    active: true as const,
    code: formatPairingCode(pairing.code),
    phoneNumber: maskPhone(pairing.phoneNumber),
    updatedAt: pairing.updatedAt
  }
}

export function getPairingCodeRoute(app: BotApp) {
  return eventHandler(() => pairingView(app))
}

/**
 * Pede ao WhatsApp um código de pareamento para o número informado, como alternativa ao QR.
 * Só funciona enquanto o bot está esperando login (status waiting_qr).
 */
export function requestPairingCodeRoute(app: BotApp) {
  return eventHandler(async (event) => {
    const body = await readValidatedBody(event, (value) => PairingBodySchema.parse(value))
    const phoneNumber = normalizePairingPhone(body.phoneNumber)
    if (!phoneNumber) {
      throw createError({ statusCode: 400, statusMessage: 'Número inválido. Use DDI + DDD + número, só dígitos.' })
    }
    if (app.state.status !== 'waiting_qr') {
      throw createError({ statusCode: 409, statusMessage: 'O bot não está aguardando login.' })
    }
    if (!app.client.requestPairingCode) {
      throw createError({ statusCode: 501, statusMessage: 'Esta versão do whatsapp-web.js não suporta pareamento por número.' })
    }

    const code = await app.client.requestPairingCode(phoneNumber, true)
    app.state.pairing = { phoneNumber, code, updatedAt: new Date().toISOString() }
    return pairingView(app)
  })
}

export function cancelPairingCodeRoute(app: BotApp) {
  return eventHandler(async () => {
    app.state.pairing = undefined
    await app.client.cancelPairingCode?.()
    return { active: false as const }
  })
}
