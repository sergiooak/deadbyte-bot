import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'pathe'
import type { BotApp } from '../app/create-bot-app.js'
import { applyGroupMetadata, resolveStickerOptions } from '../commands/stickers/create-sticker.command.js'
import type { GroupConfigService } from '../groups/group-config.service.js'
import type { StickerService } from '../services/stickers/sticker.service.js'
import { fetchTtp } from '../services/stickers/ttp.service.js'
import { bufferMediaToWhatsappMedia } from './media.mapper.js'

/**
 * Parte da API do whatsapp-web.js usada pelo controle remoto do painel.
 * Fica separada do WhatsappClientLike para não exigir esses métodos nos testes de comando.
 */
type ControlChat = {
  id: { _serialized: string }
  name: string
  isGroup: boolean
  isReadOnly?: boolean
  isMuted: boolean
  muteExpiration?: number
  archived: boolean
  pinned: boolean
  unreadCount: number
  timestamp: number
  description?: string
  owner?: { _serialized: string }
  createdAt?: Date
  participants?: Array<{ id: { _serialized: string; user: string }; isAdmin: boolean; isSuperAdmin: boolean }>
  sendMessage: (content: unknown, options?: Record<string, unknown>) => Promise<unknown>
  sendSeen: () => Promise<boolean>
  markUnread: () => Promise<void>
  archive: () => Promise<void>
  unarchive: () => Promise<void>
  pin: () => Promise<boolean>
  unpin: () => Promise<boolean>
  mute: (unmuteDate?: Date) => Promise<unknown>
  unmute: () => Promise<unknown>
  clearMessages: () => Promise<boolean>
  delete: () => Promise<boolean>
  leave?: () => Promise<void>
  getInviteCode?: () => Promise<string>
  setSubject?: (subject: string) => Promise<boolean>
  setDescription?: (description: string) => Promise<boolean>
  setMessagesAdminsOnly?: (adminsOnly?: boolean) => Promise<boolean>
  setInfoAdminsOnly?: (adminsOnly?: boolean) => Promise<boolean>
}

type ControlClient = {
  info?: { wid?: { _serialized: string; user: string }; pushname?: string; platform?: string }
  getChats: () => Promise<ControlChat[]>
  getChatById: (chatId: string) => Promise<ControlChat>
  getContactById: (contactId: string) => Promise<{ getAbout: () => Promise<string | null> }>
  getProfilePicUrl: (contactId: string) => Promise<string | undefined>
  getWWebVersion: () => Promise<string>
  setDisplayName: (name: string) => Promise<boolean>
  setStatus: (status: string) => Promise<void>
  setProfilePicture: (media: unknown) => Promise<boolean>
  deleteProfilePicture: () => Promise<boolean>
  sendPresenceAvailable: () => Promise<void>
  sendPresenceUnavailable: () => Promise<void>
  setAutoDownloadAudio: (flag: boolean) => Promise<void>
  setAutoDownloadDocuments: (flag: boolean) => Promise<void>
  setAutoDownloadPhotos: (flag: boolean) => Promise<void>
  setAutoDownloadVideos: (flag: boolean) => Promise<void>
  setBackgroundSync: (flag: boolean) => Promise<void>
}

export type WhatsappSettings = {
  presence: 'available' | 'unavailable'
  autoDownloadAudio: boolean
  autoDownloadDocuments: boolean
  autoDownloadPhotos: boolean
  autoDownloadVideos: boolean
  backgroundSync: boolean
}

// O bot não precisa baixar mídia sozinho: os comandos baixam só o que vão usar.
export const DEFAULT_WHATSAPP_SETTINGS: WhatsappSettings = {
  presence: 'unavailable',
  autoDownloadAudio: false,
  autoDownloadDocuments: false,
  autoDownloadPhotos: false,
  autoDownloadVideos: false,
  backgroundSync: true
}

export type ChatAction = 'markRead' | 'markUnread' | 'archive' | 'unarchive' | 'pin' | 'unpin' | 'mute' | 'unmute' | 'clear' | 'delete' | 'leave'

function control(app: BotApp): ControlClient {
  if (app.state.status !== 'ready') {
    throw Object.assign(new Error('O WhatsApp ainda não está conectado.'), { statusCode: 409 })
  }
  return app.client as unknown as ControlClient
}

// As configurações ficam ao lado da sessão para sobreviver a redeploys junto com ela.
function settingsPath(app: BotApp): string {
  return join(app.config.sessionPath, 'deadbyte-whatsapp-settings.json')
}

export async function readWhatsappSettings(app: BotApp): Promise<WhatsappSettings> {
  try {
    return { ...DEFAULT_WHATSAPP_SETTINGS, ...(JSON.parse(await readFile(settingsPath(app), 'utf8')) as Partial<WhatsappSettings>) }
  } catch {
    return { ...DEFAULT_WHATSAPP_SETTINGS }
  }
}

export async function applyWhatsappSettings(app: BotApp, patch: Partial<WhatsappSettings> = {}): Promise<WhatsappSettings> {
  const client = control(app)
  const settings = { ...(await readWhatsappSettings(app)), ...patch }

  await (settings.presence === 'available' ? client.sendPresenceAvailable() : client.sendPresenceUnavailable())
  await client.setAutoDownloadAudio(settings.autoDownloadAudio)
  await client.setAutoDownloadDocuments(settings.autoDownloadDocuments)
  await client.setAutoDownloadPhotos(settings.autoDownloadPhotos)
  await client.setAutoDownloadVideos(settings.autoDownloadVideos)
  await client.setBackgroundSync(settings.backgroundSync)

  await writeFile(settingsPath(app), JSON.stringify(settings, null, 2), 'utf8')
  return settings
}

export async function getProfile(app: BotApp) {
  const client = control(app)
  const wid = client.info?.wid?._serialized
  const [about, pictureUrl, webVersion] = await Promise.all([
    wid ? client.getContactById(wid).then((contact) => contact.getAbout()).catch(() => null) : null,
    wid ? client.getProfilePicUrl(wid).catch(() => undefined) : undefined,
    client.getWWebVersion().catch(() => undefined)
  ])
  return {
    wid: wid ?? null,
    phoneNumber: client.info?.wid?.user ?? null,
    displayName: client.info?.pushname ?? null,
    about: about ?? null,
    pictureUrl: pictureUrl ?? null,
    platform: client.info?.platform ?? null,
    webVersion: webVersion ?? null
  }
}

export async function updateProfile(app: BotApp, patch: { displayName?: string; about?: string }) {
  const client = control(app)
  if (patch.displayName !== undefined) await client.setDisplayName(patch.displayName)
  if (patch.about !== undefined) await client.setStatus(patch.about)
  return await getProfile(app)
}

export async function setProfilePicture(app: BotApp, image: { base64: string; mimeType: string }) {
  const media = bufferMediaToWhatsappMedia({ buffer: Buffer.from(image.base64, 'base64'), mimeType: image.mimeType })
  await control(app).setProfilePicture(media)
  return await getProfile(app)
}

export async function deleteProfilePicture(app: BotApp) {
  await control(app).deleteProfilePicture()
  return await getProfile(app)
}

function chatSummary(chat: ControlChat) {
  return {
    id: chat.id._serialized,
    name: chat.name,
    isGroup: chat.isGroup,
    isReadOnly: chat.isReadOnly ?? false,
    isMuted: chat.isMuted,
    archived: chat.archived,
    pinned: chat.pinned,
    unreadCount: chat.unreadCount,
    timestamp: chat.timestamp ? new Date(chat.timestamp * 1000).toISOString() : null,
    participantsCount: chat.participants?.length ?? null
  }
}

export async function listChats(app: BotApp) {
  const chats = await control(app).getChats()
  return chats.map(chatSummary).sort((a, b) => Number(b.pinned) - Number(a.pinned) || (b.timestamp ?? '').localeCompare(a.timestamp ?? ''))
}

export async function getChat(app: BotApp, chatId: string) {
  const chat = await control(app).getChatById(chatId)
  return {
    ...chatSummary(chat),
    description: chat.description ?? null,
    owner: chat.owner?._serialized ?? null,
    createdAt: chat.createdAt ? new Date(chat.createdAt).toISOString() : null,
    participants:
      chat.participants?.map((participant) => ({
        id: participant.id._serialized,
        user: participant.id.user,
        isAdmin: participant.isAdmin,
        isSuperAdmin: participant.isSuperAdmin
      })) ?? []
  }
}

export async function sendToChat(
  app: BotApp,
  chatId: string,
  message: {
    text?: string
    media?: { base64: string; mimeType: string; filename?: string }
    mentionAll?: boolean
    /** Envia o texto como figurinha TTP no estilo informado, igual ao !ttp/!ttp2/!ttp3. */
    ttpStyle?: 1 | 2 | 3
  }
) {
  const chat = await control(app).getChatById(chatId)
  const mentions = message.mentionAll && chat.isGroup ? (chat.participants ?? []).map((participant) => participant.id._serialized) : undefined

  if (message.ttpStyle && message.text?.trim()) {
    await chat.sendMessage(await createTtpSticker(app, chat, message.text.trim(), message.ttpStyle), { sendMediaAsSticker: true })
  } else if (message.media) {
    const media = bufferMediaToWhatsappMedia({
      buffer: Buffer.from(message.media.base64, 'base64'),
      mimeType: message.media.mimeType,
      filename: message.media.filename
    })
    await chat.sendMessage(media, { caption: message.text || undefined, mentions })
  } else if (message.text) {
    await chat.sendMessage(message.text, { mentions })
  }
  return { ok: true }
}

/** Mesma figurinha do comando sticker.ttp: pacote/autor da config de figurinhas e do grupo. */
async function createTtpSticker(app: BotApp, chat: ControlChat, text: string, style: 1 | 2 | 3) {
  const services = app.services as { stickers?: StickerService; groupConfigs?: GroupConfigService }
  if (!services.stickers) {
    throw new Error('StickerService não disponível.')
  }
  const image = await fetchTtp(text, style)
  const { metadata, options } = resolveStickerOptions(app.config.commands['sticker.create']?.config)
  const sticker = await services.stickers.createSticker(
    image,
    applyGroupMetadata(metadata, { isGroup: chat.isGroup, id: chat.id._serialized }, services.groupConfigs),
    { ...options, fit: 'contain' }
  )
  return bufferMediaToWhatsappMedia({ buffer: sticker.buffer, mimeType: sticker.mimeType, filename: 'sticker.webp' })
}

export async function runChatAction(app: BotApp, chatId: string, action: ChatAction) {
  const chat = await control(app).getChatById(chatId)
  switch (action) {
    case 'markRead': await chat.sendSeen(); break
    case 'markUnread': await chat.markUnread(); break
    case 'archive': await chat.archive(); break
    case 'unarchive': await chat.unarchive(); break
    case 'pin': await chat.pin(); break
    case 'unpin': await chat.unpin(); break
    case 'mute': await chat.mute(); break
    case 'unmute': await chat.unmute(); break
    case 'clear': await chat.clearMessages(); break
    case 'delete': await chat.delete(); break
    case 'leave':
      if (!chat.leave) throw Object.assign(new Error('Só dá para sair de grupos.'), { statusCode: 400 })
      await chat.leave()
      break
  }
  return { ok: true }
}

export async function updateGroup(
  app: BotApp,
  chatId: string,
  patch: { subject?: string; description?: string; messagesAdminsOnly?: boolean; infoAdminsOnly?: boolean }
) {
  const chat = await control(app).getChatById(chatId)
  if (!chat.isGroup) throw Object.assign(new Error('Este chat não é um grupo.'), { statusCode: 400 })
  if (patch.subject !== undefined) await chat.setSubject?.(patch.subject)
  if (patch.description !== undefined) await chat.setDescription?.(patch.description)
  if (patch.messagesAdminsOnly !== undefined) await chat.setMessagesAdminsOnly?.(patch.messagesAdminsOnly)
  if (patch.infoAdminsOnly !== undefined) await chat.setInfoAdminsOnly?.(patch.infoAdminsOnly)
  return await getChat(app, chatId)
}

export async function getGroupInviteLink(app: BotApp, chatId: string) {
  const chat = await control(app).getChatById(chatId)
  if (!chat.getInviteCode) throw Object.assign(new Error('Este chat não é um grupo.'), { statusCode: 400 })
  return { link: `https://chat.whatsapp.com/${await chat.getInviteCode()}` }
}
