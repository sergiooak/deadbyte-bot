import { DeadByteEventNames } from '@deadbyte/runtime'
import qrcode from 'qrcode-terminal'
import type { BotApp } from '../app/create-bot-app.js'
import type { GroupConfigService } from '../groups/group-config.service.js'
import type { WhatsappGroupNotificationLike, WhatsappMessageLike } from './whatsapp-adapter.js'

function groupConfigService(app: BotApp): GroupConfigService | undefined {
  return app.services.groupConfigs as GroupConfigService | undefined
}

function notificationChatId(notification: WhatsappGroupNotificationLike): string | undefined {
  return notification.chatId ?? notification.id?._serialized
}

function notificationRecipients(notification: WhatsappGroupNotificationLike): string[] {
  return notification.recipientIds ?? notification.recipients ?? []
}

async function refreshGroupConfigFromNotification(app: BotApp, notification: WhatsappGroupNotificationLike): Promise<void> {
  const chatId = notificationChatId(notification)
  const service = groupConfigService(app)
  if (!chatId || !service || !app.client.getChatById) return

  const chat = await app.client.getChatById(chatId)
  service.loadFromDescription(chatId, chat.description)
}

async function sendWelcomeOrGoodbye(app: BotApp, notification: WhatsappGroupNotificationLike, kind: 'welcome' | 'goodbye'): Promise<void> {
  const chatId = notificationChatId(notification)
  const service = groupConfigService(app)
  if (!chatId || !service || !app.client.getChatById) return

  const chat = await app.client.getChatById(chatId)
  const config = await service.ensureLoaded(chat)
  if (!config[kind]) return

  const recipients = notificationRecipients(notification)
  if (recipients.length === 0) return

  const mentions = recipients.map((id) => (id.includes('@') ? id : `${id}@c.us`))
  const names = mentions.map((id) => `@${id.replace(/@.+$/, '')}`).join(', ')
  const text = kind === 'welcome' ? `Bem-vindo(a), ${names}!` : `${names} saiu do grupo.`

  await app.client.sendMessage(chatId, text, { mentions })
}

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

  app.client.on('group_update', (notification) => {
    void refreshGroupConfigFromNotification(app, notification as WhatsappGroupNotificationLike)
  })

  app.client.on('group_join', (notification) => {
    void sendWelcomeOrGoodbye(app, notification as WhatsappGroupNotificationLike, 'welcome')
  })

  app.client.on('group_leave', (notification) => {
    void sendWelcomeOrGoodbye(app, notification as WhatsappGroupNotificationLike, 'goodbye')
  })
}
