import { DeadByteEventNames } from '@deadbyte/runtime'
import qrcode from 'qrcode-terminal'
import type { BotApp } from '../app/create-bot-app.js'
import type { WhatsappMessageLike } from './whatsapp-adapter.js'

export function registerWhatsappEvents(app: BotApp): void {
  app.client.on('qr', (qr) => {
    if (typeof qr !== 'string') {
      return
    }

    app.state.lastQr = qr
    app.state.status = 'waiting_qr'
    if (app.config.mode === 'standalone') {
      qrcode.generate(qr, { small: true })
    }

    void app.events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.WhatsappQrGenerated,
      level: 'info',
      instanceId: app.config.instanceId,
      payload: { qr },
      timestamp: new Date().toISOString()
    })
  })

  app.client.on('authenticated', () => {
    app.state.status = 'authenticated'
    void app.events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.WhatsappAuthenticated,
      level: 'info',
      instanceId: app.config.instanceId,
      timestamp: new Date().toISOString()
    })
  })

  app.client.on('ready', () => {
    app.state.status = 'ready'
    void app.events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.WhatsappReady,
      level: 'info',
      instanceId: app.config.instanceId,
      timestamp: new Date().toISOString()
    })
  })

  app.client.on('auth_failure', (message) => {
    app.state.status = 'error'
    void app.events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.WhatsappAuthFailure,
      level: 'error',
      instanceId: app.config.instanceId,
      message: typeof message === 'string' ? message : 'WhatsApp authentication failed.',
      timestamp: new Date().toISOString()
    })
  })

  app.client.on('disconnected', (reason) => {
    app.state.status = 'disconnected'
    void app.events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.WhatsappDisconnected,
      level: 'warn',
      instanceId: app.config.instanceId,
      payload: { reason },
      timestamp: new Date().toISOString()
    })
  })

  app.client.on('message', (message) => {
    void app.handleMessage(message as WhatsappMessageLike)
  })
}
