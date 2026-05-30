import type { BotApp } from './create-bot-app.js'

export async function shutdownBot(app: BotApp): Promise<void> {
  await app.shutdown()
}
