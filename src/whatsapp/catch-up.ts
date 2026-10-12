import type { BotApp } from '../app/create-bot-app.js'
import type { CheckpointStore } from './checkpoint.js'
import type { WhatsappMessageLike } from './whatsapp-adapter.js'

/**
 * Reprocessa mensagens que chegaram com o bot desligado.
 *
 * - checkpoint: desde a última mensagem processada (padrão ao ligar, quando existe checkpoint).
 * - unread: chats marcados como não lidos (ao ligar sem checkpoint).
 * - today: tudo que não foi respondido hoje (manual, pelo painel).
 *
 * Em todos os modos só entram mensagens depois da última mensagem do próprio bot no chat: se o bot
 * já respondeu, o chat não é reprocessado. Os limites abaixo evitam rajadas que chamam atenção do
 * WhatsApp (risco de ban): poucas mensagens por chat, teto por rodada e pausa aleatória entre elas.
 */
export type CatchUpMode = 'checkpoint' | 'unread' | 'today'

export type CatchUpResult = {
  mode: CatchUpMode
  since: string
  startedAt: string
  finishedAt?: string
  chats: number
  messages: number
  skipped: number
  error?: string
}

export const CATCH_UP_LIMITS = {
  /** Mensagens mais antigas que isso nunca são reprocessadas. */
  maxAgeHours: 24,
  /** Só as últimas N mensagens pendentes de cada chat. */
  perChat: 3,
  /** Teto de mensagens por rodada. */
  total: 50,
  minDelayMs: 2000,
  maxDelayMs: 5000,
  /** Quantas mensagens recentes ler de cada chat para achar as pendentes. */
  fetchLimit: 30,
  /** Espera depois do ready para o WhatsApp terminar de sincronizar. */
  startDelayMs: 15_000
}

type CatchUpMessage = WhatsappMessageLike & { fromMe?: boolean }

type CatchUpChat = {
  id: { _serialized: string }
  name?: string
  isReadOnly?: boolean
  unreadCount?: number
  timestamp?: number
  fetchMessages: (options: { limit?: number }) => Promise<CatchUpMessage[]>
  sendSeen?: () => Promise<boolean>
}

let running: Promise<CatchUpResult> | undefined

function checkpoints(app: BotApp): CheckpointStore | undefined {
  return app.services.checkpoints as CheckpointStore | undefined
}

/** Início do dia de hoje no fuso informado, em segundos (o container roda em UTC). */
export function startOfToday(timeZone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(now)
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? 0)
  return Math.floor(now.getTime() / 1000) - (part('hour') * 3600 + part('minute') * 60 + part('second'))
}

/** Mensagens recebidas depois da última resposta do bot, a partir de `since`. */
export function pendingMessages(recent: CatchUpMessage[], since: number, skipId?: string): CatchUpMessage[] {
  const sorted = [...recent].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
  let lastOwn = -1
  sorted.forEach((message, index) => {
    if (message.fromMe) lastOwn = index
  })
  return sorted
    .slice(lastOwn + 1)
    .filter((message) => !message.fromMe && !message.isStatus && (message.timestamp ?? 0) >= since && message.id?._serialized !== skipId)
}

export function catchUpStatus(app: BotApp) {
  return {
    running: Boolean(running),
    enabled: process.env.DEADBYTE_CATCHUP !== 'off',
    checkpoint: checkpoints(app)?.get() ?? null,
    last: app.state.lastCatchUp ?? null,
    limits: CATCH_UP_LIMITS
  }
}

export function startCatchUp(app: BotApp, mode: CatchUpMode): { started: boolean; reason?: string } {
  if (running) return { started: false, reason: 'Já existe um reprocessamento em andamento.' }
  if (app.state.status !== 'ready') return { started: false, reason: 'O WhatsApp não está conectado.' }
  running = runCatchUp(app, mode).finally(() => {
    running = undefined
  })
  return { started: true }
}

/** Ao conectar: desde o checkpoint, ou os não lidos quando ainda não há checkpoint. */
export function scheduleCatchUpOnReady(app: BotApp): void {
  if (process.env.DEADBYTE_CATCHUP === 'off') return
  const timer = setTimeout(() => {
    startCatchUp(app, checkpoints(app)?.get() ? 'checkpoint' : 'unread')
  }, CATCH_UP_LIMITS.startDelayMs)
  timer.unref?.()
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function runCatchUp(app: BotApp, mode: CatchUpMode): Promise<CatchUpResult> {
  const now = Math.floor(Date.now() / 1000)
  const floor = now - CATCH_UP_LIMITS.maxAgeHours * 3600
  const checkpoint = checkpoints(app)?.get()
  const since =
    mode === 'today'
      ? Math.max(startOfToday(process.env.DEADBYTE_TIMEZONE || 'America/Sao_Paulo'), floor)
      : mode === 'checkpoint' && checkpoint
        ? Math.max(checkpoint.lastMessageAt, floor)
        : floor
  const skipId = mode === 'checkpoint' ? checkpoint?.lastMessageId : undefined

  const result: CatchUpResult = { mode, since: new Date(since * 1000).toISOString(), startedAt: new Date().toISOString(), chats: 0, messages: 0, skipped: 0 }
  app.state.lastCatchUp = result
  await emit(app, 'runtime.catch_up.started', 'info', result)

  try {
    const client = app.client as unknown as { getChats: () => Promise<CatchUpChat[]> }
    const chats = (await client.getChats())
      .filter((chat) => !chat.isReadOnly && !/@(broadcast|newsletter)$/.test(chat.id._serialized))
      .filter((chat) => (chat.timestamp ?? 0) >= since && (mode !== 'unread' || (chat.unreadCount ?? 0) > 0))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))

    for (const chat of chats) {
      if (app.state.status !== 'ready' || result.messages >= CATCH_UP_LIMITS.total) break

      let pending = pendingMessages(await chat.fetchMessages({ limit: CATCH_UP_LIMITS.fetchLimit }), since, skipId)
      if (mode === 'unread') pending = pending.slice(-(chat.unreadCount ?? 0))
      const selected = pending.slice(-CATCH_UP_LIMITS.perChat)
      result.skipped += pending.length - selected.length
      if (selected.length === 0) continue

      result.chats += 1
      for (const message of selected) {
        if (result.messages >= CATCH_UP_LIMITS.total) {
          result.skipped += 1
          continue
        }
        await app.handleMessage(message)
        result.messages += 1
        await sleep(CATCH_UP_LIMITS.minDelayMs + Math.random() * (CATCH_UP_LIMITS.maxDelayMs - CATCH_UP_LIMITS.minDelayMs))
      }
      await chat.sendSeen?.().catch(() => undefined)
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
  }

  result.finishedAt = new Date().toISOString()
  app.state.lastCatchUp = result
  await emit(app, 'runtime.catch_up.finished', result.error ? 'error' : 'info', result)
  return result
}

async function emit(app: BotApp, name: string, level: 'info' | 'error', payload: CatchUpResult) {
  await app.events.emit({
    id: crypto.randomUUID(),
    name,
    level,
    instanceId: app.config.instanceId,
    message: payload.error,
    payload: { ...payload },
    timestamp: new Date().toISOString()
  })
}
