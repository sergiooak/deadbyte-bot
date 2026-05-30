import whatsappWebJs from 'whatsapp-web.js'

const { LocalAuth } = whatsappWebJs as unknown as {
  LocalAuth: new (options: { clientId: string; dataPath: string }) => unknown
}

export function createLocalAuth(options: { clientId: string; dataPath: string }) {
  return new LocalAuth({
    clientId: options.clientId,
    dataPath: options.dataPath
  })
}
