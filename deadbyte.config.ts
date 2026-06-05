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
    clientId: process.env.DEADBYTE_CLIENT_ID || 'deadbyte'
  },
  internalApi: {
    enabled: false,
    host: '127.0.0.1',
    port: 41001
  },
  commands: {
    'system.menu': {
      enabled: true,
      aliases: ['menu', 'ajuda', 'help', 'comandos']
    },
    'system.ping': {
      enabled: true,
      aliases: ['ping', 'p']
    },
    'system.status': {
      enabled: true,
      aliases: ['status', 'stat']
    },
    'system.time': {
      enabled: true,
      aliases: ['hora', 'time', 'horas', 'horario']
    },
    'group.config': {
      enabled: true,
      aliases: ['config']
    },
    'group.config-on': {
      enabled: true,
      aliases: ['on']
    },
    'group.config-off': {
      enabled: true,
      aliases: ['off']
    },
    'group.config-set': {
      enabled: true,
      aliases: ['set']
    },
    'sticker.create': {
      enabled: true,
      aliases: ['s', 'sticker', 'f', 'fig', 'figurinha'],
      config: {
        defaultPackName: 'DeadByte.com.br',
        defaultPackPublisher: 'bot de figurinhas',
        videoFps: 10,
        maxVideoSeconds: 7,
        defaultFit: 'contain',
        squareThreshold: 0.85,
        fallbackRenderSizes: [512, 384, 256, 170],
        imageQuality: 80,
        videoQuality: 70,
        compressionEnabled: true
      }
    },
    'sticker.fit': {
      enabled: true,
      aliases: ['ff', 'fit', 'sf', 'inteira', 'inteiro', 'fi']
    },
    'sticker.crop': {
      enabled: true,
      aliases: ['fc', 'crop', 'sc', 'cortado', 'cortada', 'quadrado', 'quadrada']
    },
    'sticker.stretch': {
      enabled: true,
      aliases: ['fe', 'estica', 'stretch', 'ss', 'achatada', 'achatado']
    },
    'sticker.steal': {
      enabled: true,
      aliases: ['steal', 'roubar', 'rename', 'renomear']
    },
    'sticker.to-media': {
      enabled: true,
      aliases: ['arquivo', 'desfig', 'unsticker', 'toimg']
    },
    'fun.emoji': {
      enabled: true,
      aliases: ['emoji']
    },
    'fun.react': {
      enabled: true,
      aliases: ['react', 'reacao', 'reagir']
    },
    'fun.boot-correction': {
      enabled: true,
      aliases: ['boot']
    },
    'utility.ddd': {
      enabled: true,
      aliases: ['ddd']
    },
    'utility.ddi': {
      enabled: true,
      aliases: ['ddi']
    },
    'fun.dice': {
      enabled: true,
      aliases: ['dado', 'dice', 'rolar', 'rola', 'd']
    },
    'fun.math': {
      enabled: true,
      aliases: ['calc', 'calcular', 'math', 'conta']
    }
  }
})
