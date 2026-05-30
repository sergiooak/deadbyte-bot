import {
  DeadByteEventNames,
  createCommandRegistry,
  type DeadByteBot,
  type DeadByteCommand,
  type DeadByteEventLogger,
  type ResolvedDeadByteConfig
} from '@deadbyte/runtime'
import { createMessageContext } from '../context/create-message-context.js'
import { ensureCommandEnabled } from '../middlewares/command-disabled.middleware.js'
import { runCommandWithBoundary } from '../middlewares/error-boundary.middleware.js'
import { ensureOwnerAllowed } from '../middlewares/owner-only.middleware.js'
import { CommandQueue } from '../queue/command-queue.js'
import { FfmpegService } from '../services/media/ffmpeg.service.js'
import { StickerCompressorService } from '../services/stickers/sticker-compressor.service.js'
import { StickerExifService } from '../services/stickers/sticker-exif.service.js'
import { StickerRendererService } from '../services/stickers/sticker-renderer.service.js'
import { StickerService } from '../services/stickers/sticker.service.js'
import { readBotEnv } from '../utils/env.js'
import type { WhatsappClientLike, WhatsappMessageLike } from '../whatsapp/whatsapp-adapter.js'

export type BotState = {
  status: 'created' | 'starting' | 'waiting_qr' | 'authenticated' | 'ready' | 'disconnected' | 'stopping' | 'stopped' | 'error'
  startedAt: number
  lastQr?: string
}

export type BotApp = {
  bot: DeadByteBot
  config: ResolvedDeadByteConfig
  client: WhatsappClientLike
  events: DeadByteEventLogger
  state: BotState
  services: Record<string, unknown>
  handleMessage: (message: WhatsappMessageLike) => Promise<void>
  sendMessage: (chatId: string, text: string) => Promise<void>
  shutdown: () => Promise<void>
}

export function formatUptime(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`
}

export function createBotApp(options: {
  bot: DeadByteBot
  config: ResolvedDeadByteConfig
  client: WhatsappClientLike
  events: DeadByteEventLogger
}): BotApp {
  const state: BotState = {
    status: 'created',
    startedAt: Date.now()
  }
  const queue = new CommandQueue()
  const env = readBotEnv()
  const ffmpeg = new FfmpegService({ ffmpegPath: env.FFMPEG_PATH, ffprobePath: env.FFPROBE_PATH })
  const stickers = new StickerService(
    new StickerRendererService(ffmpeg),
    new StickerExifService(),
    new StickerCompressorService(options.events),
    options.events
  )
  const services: Record<string, unknown> = {
    stickers,
    runtime: state
  }
  const registry = createCommandRegistry(options.bot.commands, options.config)

  async function executeCommand(command: DeadByteCommand, rawMessage: WhatsappMessageLike): Promise<void> {
    const ctx = await createMessageContext(rawMessage, {
      client: options.client,
      config: options.config,
      services
    })

    if (!ctx.parsedCommand?.explicit && !command.supports.implicit) {
      return
    }

    if (!(await ensureCommandEnabled(command, ctx))) {
      await options.events.emit({
        id: crypto.randomUUID(),
        name: DeadByteEventNames.CommandDisabled,
        level: 'info',
        instanceId: options.config.instanceId,
        payload: { commandId: command.id },
        timestamp: new Date().toISOString()
      })
      return
    }

    if (!(await ensureOwnerAllowed(command, ctx))) {
      await options.events.emit({
        id: crypto.randomUUID(),
        name: DeadByteEventNames.CommandPermissionDenied,
        level: 'warn',
        instanceId: options.config.instanceId,
        payload: { commandId: command.id },
        timestamp: new Date().toISOString()
      })
      return
    }

    await options.events.emit({
      id: crypto.randomUUID(),
      name: DeadByteEventNames.CommandMatched,
      level: 'info',
      instanceId: options.config.instanceId,
      payload: { commandId: command.id, alias: ctx.parsedCommand?.rawName },
      timestamp: new Date().toISOString()
    })

    await runCommandWithBoundary(command, ctx, options.events)
  }

  return {
    bot: options.bot,
    config: options.config,
    client: options.client,
    events: options.events,
    state,
    services,
    async handleMessage(rawMessage) {
      await queue.enqueue(async () => {
        const previewContext = await createMessageContext(rawMessage, {
          client: options.client,
          config: options.config,
          services
        })

        await options.events.emit({
          id: crypto.randomUUID(),
          name: DeadByteEventNames.MessageReceived,
          level: 'debug',
          instanceId: options.config.instanceId,
          payload: {
            messageId: previewContext.message.id,
            chatId: previewContext.chat.id,
            hasMedia: previewContext.message.hasMedia
          },
          timestamp: new Date().toISOString()
        })

        const normalized = previewContext.parsedCommand?.normalizedName
        const registryMatch = normalized ? registry.byAlias.get(normalized) : undefined
        const candidates = registryMatch ? [registryMatch] : options.bot.commands

        for (const command of candidates) {
          const shouldRun = registryMatch ? true : await command.match(previewContext)
          if (!shouldRun) {
            continue
          }
          await executeCommand(command, rawMessage)
          return
        }

        await options.events.emit({
          id: crypto.randomUUID(),
          name: DeadByteEventNames.MessageIgnored,
          level: 'debug',
          instanceId: options.config.instanceId,
          payload: { reason: 'no_command_match' },
          timestamp: new Date().toISOString()
        })
      })
    },
    async sendMessage(chatId, text) {
      await options.client.sendMessage(chatId, text)
    },
    async shutdown() {
      state.status = 'stopping'
      await options.client.destroy()
      state.status = 'stopped'
      await options.events.emit({
        id: crypto.randomUUID(),
        name: DeadByteEventNames.RuntimeStopped,
        level: 'info',
        instanceId: options.config.instanceId,
        timestamp: new Date().toISOString()
      })
    }
  }
}
