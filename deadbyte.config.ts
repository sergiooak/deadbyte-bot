import { defineDeadByteConfig } from '@deadbyte/runtime'

export default defineDeadByteConfig({
  mode: 'standalone',
  prefixes: ['!', '.', '/', '#'],
  fallbackPrefixes: ['#'],
  owners: [],
  whatsapp: {
    headless: true,
    chromePath: undefined,
    sessionPath: './.wwebjs_auth',
    clientId: 'deadbyte-local'
  },
  internalApi: {
    enabled: false,
    host: '127.0.0.1',
    port: 41001
  },
  commands: {
    'system.ping': {
      enabled: true,
      aliases: ['ping', 'p']
    },
    'system.status': {
      enabled: true,
      aliases: ['status', 'stat']
    },
    'sticker.create': {
      enabled: true,
      aliases: ['s', 'sticker', 'f', 'fig', 'figurinha'],
      config: {
        defaultPackName: 'DeadByte.com.br',
        defaultPackPublisher: 'bot de figurinhas',
        outputSize: 512,
        maxStickerBytes: 1000000,
        videoFps: 10,
        maxVideoSeconds: 7,
        defaultFit: 'contain',
        fallbackRenderSizes: [512, 384, 256, 170],
        imageQuality: 80,
        videoQuality: 70,
        compressionEnabled: true
      }
    },
    'sticker.steal': {
      enabled: true,
      aliases: ['steal', 'roubar', 'rename', 'renomear']
    },
    'fun.emoji': {
      enabled: true,
      aliases: ['emoji']
    },
    'fun.react': {
      enabled: true,
      aliases: ['react', 'reacao', 'reagir']
    }
  }
})
