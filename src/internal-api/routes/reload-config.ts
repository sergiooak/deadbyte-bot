import { eventHandler } from 'h3'
import type { BotApp } from '../../app/create-bot-app.js'

export function reloadConfigRoute(app: BotApp) {
  return eventHandler(() => ({
    ok: true,
    reloaded: false,
    message: app.config.mode === 'managed' ? 'Runtime config reload hook is ready for spawner integration.' : 'Standalone config reload is a safe stub.'
  }))
}
