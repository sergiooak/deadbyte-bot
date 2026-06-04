import type { CommandContext } from '@deadbyte/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ofetch } from 'ofetch'
import { dddCommand } from '../src/commands/utility/ddd.command.js'
import { ddiCommand } from '../src/commands/utility/ddi.command.js'

vi.mock('ofetch', () => ({
  ofetch: vi.fn()
}))

function createContext(command: 'ddd' | 'ddi', argsText: string, overrides: Partial<CommandContext> = {}): CommandContext {
  return {
    message: {
      id: 'message-1',
      from: '123@g.us',
      body: `!${command} ${argsText}`.trim(),
      hasMedia: false
    },
    chat: {
      id: '123@g.us',
      isGroup: true
    },
    sender: {
      id: '553499999999@c.us'
    },
    parsedCommand: {
      explicit: true,
      prefix: '!',
      rawName: command,
      normalizedName: command,
      argsText,
      source: 'message'
    },
    permissions: {
      isOwner: false,
      isGroup: true,
      senderId: '553499999999@c.us',
      chatId: '123@g.us'
    },
    config: {
      mode: 'standalone',
      instanceId: 'test',
      clientId: 'test',
      sessionPath: '.deadbyte',
      prefixes: ['!'],
      fallbackPrefixes: [],
      owners: [],
      commands: {
        'utility.ddd': { aliases: ['ddd'] },
        'utility.ddi': { aliases: ['ddi'] }
      },
      internalApi: { enabled: false, host: '127.0.0.1', port: 0 },
      logging: { pretty: false, eventsToStdout: false, level: 'info' },
      whatsapp: { headless: true, sessionPath: '.deadbyte', clientId: 'test' }
    },
    services: {},
    reply: vi.fn(),
    replyWithSticker: vi.fn(),
    react: vi.fn(),
    ...overrides
  } as CommandContext
}

describe('phone code commands', () => {
  beforeEach(() => {
    vi.mocked(ofetch).mockReset()
  })

  it('tells the user to use ddi when ddd receives an international number', async () => {
    const ctx = createContext('ddd', '+351 912 345 678')

    await dddCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(vi.mocked(ctx.reply).mock.calls[0]?.[0]).toContain('número gringo')
    expect(vi.mocked(ctx.reply).mock.calls[0]?.[0]).toContain('!ddi +351')
    expect(ofetch).not.toHaveBeenCalled()
  })

  it('handles multiple mentions with a single ddd reply', async () => {
    vi.mocked(ofetch).mockResolvedValue({
      state: 'MG',
      cities: ['UBERLÂNDIA', 'ARAGUARI']
    })

    const ctx = createContext('ddd', '@553499999999 @351912345678', {
      message: {
        id: 'message-1',
        from: '123@g.us',
        body: '!ddd @553499999999 @351912345678',
        hasMedia: false,
        mentionedIds: ['553499999999@c.us', '351912345678@c.us']
      },
      parsedCommand: {
        explicit: true,
        prefix: '!',
        rawName: 'ddd',
        normalizedName: 'ddd',
        argsText: '@553499999999 @351912345678',
        source: 'message'
      },
      services: {
        resolveMentionedContacts: async () => [
          { id: '553499999999@c.us', number: '553499999999', pushname: 'Pessoa BR' },
          { id: '351912345678@c.us', number: '351912345678', pushname: 'Pessoa PT' }
        ]
      }
    })

    await dddCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(ofetch).toHaveBeenCalledOnce()
    const reply = vi.mocked(ctx.reply).mock.calls[0]?.[0] ?? ''
    expect(reply).toContain('DDD|Código')
    expect(reply).toContain('34*')
    expect(reply).toContain('Minas Gerais')
    expect(reply).toContain('MG')
    expect(reply).toContain('Uberlândia')
    expect(reply).toContain('número gringo')
  })

  it('uses the quoted contact when ddd is called as a reply', async () => {
    vi.mocked(ofetch).mockResolvedValue({
      state: 'MG',
      cities: ['UBERLÃ‚NDIA']
    })

    const ctx = createContext('ddd', '', {
      quotedMessage: {
        id: 'quoted-1',
        from: '123@g.us',
        author: 'ignored@c.us',
        body: 'oi',
        hasMedia: false
      },
      services: {
        resolveTargetContact: async () => ({ id: '553499999999@c.us', number: '553499999999', pushname: 'Pessoa BR' })
      }
    })

    await dddCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(ofetch).toHaveBeenCalledWith('https://brasilapi.com.br/api/ddd/v1/34')
  })

  it('does not treat lid digits or contact names as phone numbers', async () => {
    const ctx = createContext('ddd', '@Victor', {
      message: {
        id: 'message-1',
        from: '123@g.us',
        body: '!ddd @Victor',
        hasMedia: false,
        mentionedIds: ['471234567890@lid']
      },
      parsedCommand: {
        explicit: true,
        prefix: '!',
        rawName: 'ddd',
        normalizedName: 'ddd',
        argsText: '@Victor',
        source: 'message'
      },
      services: {
        resolveMentionedContacts: async () => [
          { id: '471234567890@lid', number: 'Victor (Vzx)', pushname: 'Victor (Vzx)' }
        ]
      }
    })

    await dddCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    const reply = vi.mocked(ctx.reply).mock.calls[0]?.[0] ?? ''
    expect(reply).toContain('um DDD')
    expect(reply).toContain('marque a pessoa')
    expect(reply).toContain('!ddd 34')
    expect(reply).not.toContain('!ddi +47')
    expect(ofetch).not.toHaveBeenCalled()
  })

  it('tells the user to use ddd when ddi receives a brazilian full number', async () => {
    const ctx = createContext('ddi', '+55 34 99999-9999')

    await ddiCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    const reply = vi.mocked(ctx.reply).mock.calls[0]?.[0] ?? ''
    expect(reply).toContain('número BR')
    expect(reply).toContain('!ddd 34')
  })

  it('warns when ddi receives a full number without country code', async () => {
    const ctx = createContext('ddi', '34 99999-9999')

    await ddiCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    expect(vi.mocked(ctx.reply).mock.calls[0]?.[0]).toContain('número sem DDI')
  })

  it('accepts an international full number for ddi', async () => {
    const ctx = createContext('ddi', '+351 912 345 678')

    await ddiCommand.run(ctx)

    expect(ctx.reply).toHaveBeenCalledOnce()
    const reply = vi.mocked(ctx.reply).mock.calls[0]?.[0] ?? ''
    expect(reply).toContain('DDI|Código')
    expect(reply).toContain('+351*')
    expect(reply).toContain('Portugal')
  })
})
