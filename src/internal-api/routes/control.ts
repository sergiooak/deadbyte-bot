import { createError, eventHandler, getRouterParam, readValidatedBody, type EventHandler } from 'h3'
import { z } from 'zod'
import type { BotApp } from '../../app/create-bot-app.js'
import {
  applyWhatsappSettings,
  deleteProfilePicture,
  getChat,
  getGroupInviteLink,
  getProfile,
  listChats,
  readWhatsappSettings,
  runChatAction,
  sendToChat,
  setProfilePicture,
  updateGroup,
  updateProfile
} from '../../whatsapp/whatsapp-control.js'

// Imagens chegam em base64; ~10 MB de arquivo.
const MAX_BASE64_LENGTH = 14_000_000

const MediaSchema = z.object({
  base64: z.string().min(1).max(MAX_BASE64_LENGTH),
  mimeType: z.string().min(1),
  filename: z.string().optional()
})

const ProfileSchema = z.object({
  displayName: z.string().min(1).max(25).optional(),
  about: z.string().max(139).optional()
})

const SettingsSchema = z.object({
  presence: z.enum(['available', 'unavailable']).optional(),
  autoDownloadAudio: z.boolean().optional(),
  autoDownloadDocuments: z.boolean().optional(),
  autoDownloadPhotos: z.boolean().optional(),
  autoDownloadVideos: z.boolean().optional(),
  backgroundSync: z.boolean().optional()
})

const SendSchema = z
  .object({
    text: z.string().max(65_536).optional(),
    media: MediaSchema.optional(),
    mentionAll: z.boolean().optional(),
    ttpStyle: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional()
  })
  .refine((value) => value.text || value.media, 'Informe um texto ou um arquivo.')
  .refine((value) => !value.ttpStyle || value.text?.trim(), 'Escreva o texto da figurinha TTP.')

const ActionSchema = z.object({
  action: z.enum(['markRead', 'markUnread', 'archive', 'unarchive', 'pin', 'unpin', 'mute', 'unmute', 'clear', 'delete', 'leave'])
})

const GroupSchema = z.object({
  subject: z.string().min(1).max(100).optional(),
  description: z.string().max(2048).optional(),
  messagesAdminsOnly: z.boolean().optional(),
  infoAdminsOnly: z.boolean().optional()
})

/** Converte erros com statusCode (ex.: WhatsApp desconectado) em respostas HTTP. */
function guarded(handler: Parameters<typeof eventHandler>[0]): EventHandler {
  return eventHandler(async (event) => {
    try {
      return await (handler as (event: unknown) => unknown)(event)
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode ?? 500
      throw createError({ statusCode, statusMessage: error instanceof Error ? error.message : String(error) })
    }
  })
}

function chatId(event: Parameters<typeof getRouterParam>[0]): string {
  const id = getRouterParam(event, 'chatId')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing chat id.' })
  return decodeURIComponent(id)
}

export function controlRoutes(app: BotApp) {
  return {
    getProfile: guarded(() => getProfile(app)),
    updateProfile: guarded(async (event) => updateProfile(app, await readValidatedBody(event, (value) => ProfileSchema.parse(value)))),
    setPicture: guarded(async (event) => setProfilePicture(app, await readValidatedBody(event, (value) => MediaSchema.parse(value)))),
    deletePicture: guarded(() => deleteProfilePicture(app)),
    getSettings: guarded(() => readWhatsappSettings(app)),
    updateSettings: guarded(async (event) => applyWhatsappSettings(app, await readValidatedBody(event, (value) => SettingsSchema.parse(value)))),
    listChats: guarded(() => listChats(app)),
    getChat: guarded((event) => getChat(app, chatId(event))),
    sendToChat: guarded(async (event) => sendToChat(app, chatId(event), await readValidatedBody(event, (value) => SendSchema.parse(value)))),
    chatAction: guarded(async (event) => runChatAction(app, chatId(event), (await readValidatedBody(event, (value) => ActionSchema.parse(value))).action)),
    updateGroup: guarded(async (event) => updateGroup(app, chatId(event), await readValidatedBody(event, (value) => GroupSchema.parse(value)))),
    inviteLink: guarded((event) => getGroupInviteLink(app, chatId(event)))
  }
}
