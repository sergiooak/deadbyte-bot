import { readValidatedBody, eventHandler } from 'h3'
import { z } from 'zod'
import type { BotApp } from '../../app/create-bot-app.js'

const SendMessageBodySchema = z.object({
  chatId: z.string().min(1),
  text: z.string().min(1)
})

export function sendMessageRoute(app: BotApp) {
  return eventHandler(async (event) => {
    const body = await readValidatedBody(event, (value) => SendMessageBodySchema.parse(value))
    await app.sendMessage(body.chatId, body.text)
    return { ok: true }
  })
}
