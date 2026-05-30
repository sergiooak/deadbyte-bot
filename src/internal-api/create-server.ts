import { createApp, createRouter, toNodeListener } from 'h3'
import { listen } from 'listhen'
import type { BotApp } from '../app/create-bot-app.js'
import { healthRoute } from './routes/health.js'
import { logoutRoute } from './routes/logout.js'
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
  router.post('/shutdown', shutdownRoute(app))
  h3App.use(router)

  const listener = await listen(toNodeListener(h3App), {
    hostname: app.config.internalApi.host,
    port: app.config.internalApi.port,
    showURL: app.config.mode === 'standalone'
  })

  app.services.internalApi = listener
}
