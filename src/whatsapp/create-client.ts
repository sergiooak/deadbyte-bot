import type { ResolvedDeadByteConfig } from '@deadbyte/runtime'
import whatsappWebJs from 'whatsapp-web.js'
import { readBotEnv } from '../utils/env.js'
import { createLocalAuth } from './auth.js'
import type { WhatsappClientLike } from './whatsapp-adapter.js'

const { Client } = whatsappWebJs as unknown as {
  Client: new (options: Record<string, unknown>) => unknown
}

export function createWhatsappClient(config: ResolvedDeadByteConfig): WhatsappClientLike {
  const env = readBotEnv()

  const client = new Client({
    authStrategy: createLocalAuth({
      clientId: config.clientId,
      dataPath: config.sessionPath
    }),
    ffmpegPath: env.FFMPEG_PATH || undefined,
    puppeteer: {
      headless: config.whatsapp.headless,
      executablePath: config.whatsapp.chromePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  })

  return client as WhatsappClientLike
}
