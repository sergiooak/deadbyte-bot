import type { CommandContext } from '@deadbyte/runtime'
import { describe, expect, it, vi } from 'vitest'
import { attpCommand } from '../src/commands/stickers/attp.command.js'
import { stickerMessages } from '../src/messages/sticker.messages.js'
import { fetchTexasAttp } from '../src/services/texas/texas-api.service.js'

vi.mock('../src/services/texas/texas-api.service.js', () => ({
  fetchTexasAttp: vi.fn()
}))

const attpMedia = {
  buffer: Buffer.from('attp-webp'),
  mimeType: 'image/webp'
}

const renderedSticker = {
  buffer: Buffer.from('sticker'),
  mimeType: 'image/webp' as const
}

function createContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    message: {
      id: 'message-1',
      from: '123@g.us',
      body: '!attp bom dia',
      hasMedia: false,
      type: 'chat'
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
      rawName: 'attp',
      normalizedName: 'attp',
      argsText: 'bom dia',
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
        'sticker.attp': { aliases: ['attp'] }
      }
    } as unknown as CommandContext['config'],
    services: {
      stickers: {
        createSticker: vi.fn().mockResolvedValue(renderedSticker)
      }
    },
    reply: vi.fn(),
    replyWithSticker: vi.fn(),
    react: vi.fn(),
    ...overrides
  } as CommandContext
}

describe('attpCommand', () => {
  it('matches only explicit ATTP aliases', async () => {
    const explicit = createContext()
    const implicit = createContext({
      parsedCommand: {
        explicit: false,
        rawName: 'attp',
        normalizedName: 'attp',
        argsText: 'bom dia',
        source: 'implicit'
      }
    } as Partial<CommandContext>)

    await expect(attpCommand.match(explicit)).resolves.toBe(true)
    await expect(attpCommand.match(implicit)).resolves.toBe(false)
  })

  it('creates a sticker from explicit text', async () => {
    vi.mocked(fetchTexasAttp).mockResolvedValue(attpMedia)
    const createSticker = vi.fn().mockResolvedValue(renderedSticker)
    const ctx = createContext({
      services: {
        stickers: { createSticker }
      }
    } as Partial<CommandContext>)

    await attpCommand.run(ctx)

    expect(fetchTexasAttp).toHaveBeenCalledWith('bom dia')
    expect(createSticker).toHaveBeenCalledWith(attpMedia, expect.any(Object), expect.objectContaining({ fit: 'contain' }))
    expect(ctx.replyWithSticker).toHaveBeenCalledWith(renderedSticker.buffer, renderedSticker.mimeType)
    expect(ctx.reply).not.toHaveBeenCalled()
  })

  it('replies when no text is available', async () => {
    const ctx = createContext({
      parsedCommand: {
        explicit: true,
        prefix: '!',
        rawName: 'attp',
        normalizedName: 'attp',
        argsText: '',
        source: 'message'
      }
    } as Partial<CommandContext>)

    await attpCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(vi.mocked(ctx.reply).mock.calls[0]?.[0]).toContain('!attp')
  })

  it('uses the standard sticker failure message when the API fails', async () => {
    vi.mocked(fetchTexasAttp).mockRejectedValue(new Error('texas failed'))
    const ctx = createContext()

    await attpCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledWith(stickerMessages.creationFailed)
  })
})
