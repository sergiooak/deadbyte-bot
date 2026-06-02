import { DeadByteEventNames, resolveDeadByteConfig, type DeadByteRuntimeEvent } from '@deadbyte/runtime'
import { describe, expect, it, vi } from 'vitest'
import defaultConfig from '../deadbyte.config.js'
import { createBotApp } from '../src/app/create-bot-app.js'
import { bootCorrectionCommand, messageContainsWord } from '../src/commands/fun/boot-correction.command.js'
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

function createMessage(body: string): WhatsappMessageLike & { reply: ReturnType<typeof vi.fn> } {
  return {
    id: { _serialized: `message-${body}` },
    from: 'user@c.us',
    body,
    hasMedia: false,
    type: 'chat',
    getChat: async () => ({ id: { _serialized: 'user@c.us' }, isGroup: false }),
    getContact: async () => ({ id: { _serialized: 'user@c.us' } }),
    reply: vi.fn()
  }
}

function createApp(events: DeadByteRuntimeEvent[]) {
  return createBotApp({
    bot: {
      name: 'Test Bot',
      version: '0.0.0',
      commands: [bootCorrectionCommand],
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
}

describe('bootCorrectionCommand', () => {
  it('detects boot as a standalone word', () => {
    expect(messageContainsWord('esse boot responde rapido?', 'boot')).toBe(true)
    expect(messageContainsWord('boot!', 'boot')).toBe(true)
    expect(messageContainsWord('reboot agora', 'boot')).toBe(false)
  })

  it('replies to implicit messages containing boot', async () => {
    const events: DeadByteRuntimeEvent[] = []
    const message = createMessage('esse boot esta online?')
    const app = createApp(events)

    await app.handleMessage(message)

    expect(events.some((event) => event.name === DeadByteEventNames.CommandMatched)).toBe(true)
    expect(message.reply).toHaveBeenCalledOnce()
    expect(message.reply.mock.calls[0]?.[0]).toContain('*bot*')
    expect(message.reply.mock.calls[0]?.[0]).toContain('https://pt.wikipedia.org/wiki/Bot')
    expect(message.reply.mock.calls[0]?.[0]).not.toContain('{')
    expect(message.reply.mock.calls[0]?.[2]).toEqual({ linkPreview: false })
  })

  it('also replies to the explicit boot alias', async () => {
    const events: DeadByteRuntimeEvent[] = []
    const message = createMessage('!boot')
    const app = createApp(events)

    await app.handleMessage(message)

    expect(events.some((event) => event.name === DeadByteEventNames.CommandMatched)).toBe(true)
    expect(message.reply).toHaveBeenCalledOnce()
  })
})
