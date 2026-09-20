import { describe, expect, it, vi } from 'vitest'
import { resolveTargetMessage } from '../src/context/resolve-target-message.js'
import type { WhatsappMessageLike } from '../src/whatsapp/whatsapp-adapter.js'

function createMessage(overrides: Partial<WhatsappMessageLike> = {}): WhatsappMessageLike {
  return {
    id: { _serialized: 'message-1' },
    from: '123@g.us',
    author: 'user@c.us',
    body: '',
    type: 'chat',
    hasMedia: false,
    timestamp: 1,
    ...overrides
  }
}

describe('resolveTargetMessage', () => {
  it('prioritizes media sent in a reply over the quoted media', async () => {
    const quoted = createMessage({ id: { _serialized: 'quoted-image' }, type: 'image', hasMedia: true })
    const message = createMessage({
      id: { _serialized: 'sent-gif' },
      type: 'gif',
      hasMedia: true,
      hasQuotedMsg: true,
      getQuotedMessage: vi.fn().mockResolvedValue(quoted)
    })

    const target = await resolveTargetMessage(message)

    expect(target.rawQuotedMessage).toBe(quoted)
    expect(target.rawTargetMessage).toBe(message)
    expect(target.quotedMessage?.id).toBe('quoted-image')
    expect(target.targetMessage.id).toBe('sent-gif')
  })

  it('uses the quoted message when a reply has no media', async () => {
    const quoted = createMessage({ id: { _serialized: 'quoted-image' }, type: 'image', hasMedia: true })
    const message = createMessage({
      hasQuotedMsg: true,
      getQuotedMessage: vi.fn().mockResolvedValue(quoted)
    })

    const target = await resolveTargetMessage(message)

    expect(target.rawTargetMessage).toBe(quoted)
    expect(target.targetMessage.id).toBe('quoted-image')
  })
})
