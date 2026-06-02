import { DeadByteEventNames, resolveDeadByteConfig, type DeadByteRuntimeEvent } from '@deadbyte/runtime'
import { describe, expect, it, vi } from 'vitest'
import defaultConfig from '../deadbyte.config.js'
import { createBotApp } from '../src/app/create-bot-app.js'
import { createStickerCommand } from '../src/commands/stickers/create-sticker.command.js'
import type { WhatsappClientLike, WhatsappMessageLike } from '../src/whatsapp/whatsapp-adapter.js'

function createClient(): WhatsappClientLike {
  return {
    info: { wid: { _serialized: 'bot@c.us' } },
    initialize: vi.fn(),
    destroy: vi.fn(),
    logout: vi.fn(),
    sendMessage: vi.fn(),
    on: vi.fn().mockReturnThis()
  }
}

function createGroupMessage(body: string): WhatsappMessageLike & { reply: ReturnType<typeof vi.fn> } {
  return {
    id: { _serialized: `message-${body}` },
    from: '123@g.us',
    author: 'user@c.us',
    body,
    hasMedia: false,
    type: 'chat',
    getChat: async () => ({ id: { _serialized: '123@g.us' }, isGroup: true }),
    getContact: async () => ({ id: { _serialized: 'user@c.us' } }),
    reply: vi.fn()
  }
}

describe('createBotApp command dispatch', () => {
  it('does not dispatch implicit alias text as a sticker command in groups', async () => {
    const events: DeadByteRuntimeEvent[] = []
    const app = createBotApp({
      bot: {
        name: 'Test Bot',
        version: '0.0.0',
        commands: [createStickerCommand],
        events: { message: async () => undefined }
      },
      config: resolveDeadByteConfig(defaultConfig),
      client: createClient(),
      events: {
        emit: async (event) => {
          events.push(event)
        }
      }
    })

    await app.handleMessage(createGroupMessage('F'))

    expect(events.some((event) => event.name === DeadByteEventNames.CommandMatched)).toBe(false)
    expect(events.some((event) => event.name === DeadByteEventNames.MessageIgnored)).toBe(true)
  })

  it('still dispatches prefixed sticker aliases', async () => {
    const events: DeadByteRuntimeEvent[] = []
    const message = createGroupMessage('!f')
    const app = createBotApp({
      bot: {
        name: 'Test Bot',
        version: '0.0.0',
        commands: [createStickerCommand],
        events: { message: async () => undefined }
      },
      config: resolveDeadByteConfig(defaultConfig),
      client: createClient(),
      events: {
        emit: async (event) => {
          events.push(event)
        }
      }
    })

    await app.handleMessage(message)

    expect(events.some((event) => event.name === DeadByteEventNames.CommandMatched)).toBe(true)
    expect(message.reply.mock.calls[0]?.[0]).toMatch(/^(Envie|Mande) ou (responda|marque) uma imagem\/vídeo\/sticker para (criar|fazer) a figurinha[.!]$/)
  })

  it('renders spintax natively before sending internal messages', async () => {
    const client = createClient()
    const app = createBotApp({
      bot: {
        name: 'Test Bot',
        version: '0.0.0',
        commands: [],
        events: { message: async () => undefined }
      },
      config: resolveDeadByteConfig(defaultConfig),
      client,
      events: {
        emit: async () => undefined
      }
    })

    await app.sendMessage('user@c.us', 'Oi {Sergio|DeadByte}')

    const sentText = vi.mocked(client.sendMessage).mock.calls[0]?.[1]
    expect(sentText).toMatch(/^Oi (Sergio|DeadByte)$/)
    expect(sentText).not.toContain('{')
  })
})
