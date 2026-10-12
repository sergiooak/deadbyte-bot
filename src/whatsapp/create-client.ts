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
      // /dev/shm é pequeno em containers; sem essa flag o Chromium trava em páginas pesadas.
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
  })

  return client as WhatsappClientLike
}
