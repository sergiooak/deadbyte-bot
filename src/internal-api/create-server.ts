import { createApp, createRouter, toNodeListener } from 'h3'
import { createServer } from 'node:http'
import { createError } from 'evlog'
import type { BotApp } from '../app/create-bot-app.js'
import { healthRoute } from './routes/health.js'
import { controlRoutes } from './routes/control.js'
import { logoutRoute } from './routes/logout.js'
import { cancelPairingCodeRoute, getPairingCodeRoute, requestPairingCodeRoute } from './routes/pairing-code.js'
import { reloadConfigRoute } from './routes/reload-config.js'
import { sendMessageRoute } from './routes/send-message.js'
import { shutdownRoute } from './routes/shutdown.js'
import { statusRoute } from './routes/status.js'

export async function createInternalApiServer(app: BotApp): Promise<void> {
  const h3App = createApp()
  const router = createRouter()

  router.get('/health', healthRoute(app))
  router.get('/status', statusRoute(app))
  router.post('/send-message', sendMessageRoute(app))
  router.post('/reload-config', reloadConfigRoute(app))
  router.post('/logout', logoutRoute(app))
  router.get('/pairing-code', getPairingCodeRoute(app))
  router.post('/pairing-code', requestPairingCodeRoute(app))
  router.delete('/pairing-code', cancelPairingCodeRoute(app))

  // Controle remoto usado pelo painel: perfil, configurações e chats.
  const control = controlRoutes(app)
  router.get('/profile', control.getProfile)
  router.patch('/profile', control.updateProfile)
  router.put('/profile/picture', control.setPicture)
  router.delete('/profile/picture', control.deletePicture)
  router.get('/settings', control.getSettings)
  router.patch('/settings', control.updateSettings)
  router.get('/chats', control.listChats)
  router.get('/chats/:chatId', control.getChat)
  router.post('/chats/:chatId/messages', control.sendToChat)
  router.post('/chats/:chatId/actions', control.chatAction)
  router.patch('/chats/:chatId/group', control.updateGroup)
  router.get('/chats/:chatId/invite-link', control.inviteLink)
  router.post('/shutdown', shutdownRoute(app))
  h3App.use(router)

  const { hostname, port } = { hostname: app.config.internalApi.host, port: app.config.internalApi.port }
  // Porta exata: o spawner conversa com o bot nesta porta. Sem fallback silencioso para outra porta.
  const server = createServer(toNodeListener(h3App))
  await new Promise<void>((resolve, reject) => {
    server.once('error', (error: NodeJS.ErrnoException) => {
      reject(
        error.code === 'EADDRINUSE'
          ? createError({
              message: `A porta interna ${hostname}:${port} já está em uso`,
              why: 'Outro processo (provavelmente um bot antigo desta instância) ainda está escutando nela.',
              fix: 'Pare a instância pelo painel e inicie de novo: o spawner encerra bots órfãos antes de subir.'
            })
          : error
      )
    })
    server.listen(port, hostname, () => resolve())
  })
  if (app.config.mode === 'standalone') {
    console.info(`API interna em http://${hostname}:${port}`)
  }

  app.services.internalApi = { close: () => new Promise<void>((resolve) => server.close(() => resolve())) }
}
