import { createApp, createRouter, toNodeListener } from 'h3'
import { listen } from 'listhen'
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

  const listener = await listen(toNodeListener(h3App), {
    hostname: app.config.internalApi.host,
    port: app.config.internalApi.port,
    showURL: app.config.mode === 'standalone'
  })

  app.services.internalApi = listener
}
