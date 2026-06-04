import type { CommandContext } from '@deadbyte/runtime'
import { describe, expect, it, vi } from 'vitest'
import { cropStickerCommand } from '../src/commands/stickers/crop.command.js'
import { fitStickerCommand } from '../src/commands/stickers/fit.command.js'
import { stretchStickerCommand } from '../src/commands/stickers/stretch.command.js'
import type { BufferMedia } from '../src/services/media/media.types.js'
import type { StickerFit } from '../src/services/stickers/sticker.types.js'

const media: BufferMedia = {
  buffer: Buffer.from('media'),
  mimeType: 'image/png'
}

const renderedSticker = {
  buffer: Buffer.from('sticker'),
  mimeType: 'image/webp' as const
}

function createContext(command: string, services: Partial<CommandContext['services']> = {}): CommandContext {
  return {
    message: {
      id: 'message-1',
      from: '123@g.us',
      body: `!${command}`,
      hasMedia: true,
      type: 'image'
    },
    chat: {
      id: '123@g.us',
      isGroup: true
    },
    sender: {
      id: 'user@c.us'
    },
    parsedCommand: {
      explicit: true,
      prefix: '!',
      rawName: command,
      normalizedName: command,
      argsText: '',
      source: 'message'
    },
    permissions: {
      isOwner: false,
      isGroup: true,
      senderId: 'user@c.us',
      chatId: '123@g.us'
    },
    config: {
      commands: {
        'sticker.create': { config: {} },
        'sticker.fit': { aliases: ['fit'] },
        'sticker.crop': { aliases: ['crop'] },
        'sticker.stretch': { aliases: ['stretch'] }
      }
    } as unknown as CommandContext['config'],
    services,
    reply: vi.fn(),
    replyWithSticker: vi.fn(),
    react: vi.fn()
  } as CommandContext
}

describe('sticker fit commands', () => {
  it.each([
    [fitStickerCommand, 'fit', 'contain'],
    [cropStickerCommand, 'crop', 'cover'],
    [stretchStickerCommand, 'stretch', 'stretch']
  ] as const)('creates a sticker with %s configured fit', async (command, alias, fit: StickerFit) => {
    const createSticker = vi.fn().mockResolvedValue(renderedSticker)
    const ctx = createContext(alias, {
      resolveTargetMedia: vi.fn().mockResolvedValue(media),
      stickers: { createSticker }
    })

    expect(await command.match(ctx)).toBe(true)

    await command.run(ctx)

    expect(createSticker).toHaveBeenCalledOnce()
    expect(createSticker.mock.calls[0]?.[2]).toMatchObject({ fit })
    expect(ctx.replyWithSticker).toHaveBeenCalledWith(renderedSticker.buffer, renderedSticker.mimeType)
    expect(ctx.reply).not.toHaveBeenCalled()
  })

  it('replies when no target media is available', async () => {
    const ctx = createContext('fit', {
      resolveTargetMedia: vi.fn().mockResolvedValue(undefined),
      stickers: { createSticker: vi.fn() }
    })

    await fitStickerCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(vi.mocked(ctx.reply).mock.calls[0]?.[0]).toContain('imagem/vídeo/sticker')
  })

  it('replies once when target media download fails', async () => {
    const ctx = createContext('fit', {
      resolveTargetMedia: vi.fn().mockRejectedValue(new Error('download failed')),
      stickers: { createSticker: vi.fn() }
    })

    await fitStickerCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(vi.mocked(ctx.reply).mock.calls[0]?.[0]).toContain('baixar a mídia')
  })

  it('replies when the sticker service is unavailable', async () => {
    const ctx = createContext('fit', {
      resolveTargetMedia: vi.fn().mockResolvedValue(media)
    })

    await fitStickerCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(vi.mocked(ctx.reply).mock.calls[0]?.[0]).toContain('criar a figurinha')
  })
})
