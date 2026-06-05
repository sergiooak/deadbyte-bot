import type { CommandContext } from '@deadbyte/runtime'
import { describe, expect, it } from 'vitest'
import { collectGroupTargets, normalizeParticipantId, participantUser } from '../src/groups/group-targets.js'

function createContext(overrides: Partial<CommandContext> = {}): CommandContext {
  return ({
    message: {
      id: 'message-id',
      from: '120@g.us',
      body: '',
      mentionedIds: [],
      hasMedia: false
    },
    chat: {
      id: '120@g.us',
      isGroup: true
    },
    sender: {
      id: '5511999999999@c.us'
    },
    services: {},
    ...overrides
  } as unknown) as CommandContext
}

describe('group targets', () => {
  it('normalizes participant ids and users', () => {
    expect(normalizeParticipantId('+55 (11) 99999-9999')).toBe('5511999999999@c.us')
    expect(normalizeParticipantId('123@lid')).toBe('123@lid')
    expect(participantUser('5511999999999@c.us')).toBe('5511999999999')
  })

  it('collects mentioned contacts before fallback ids', async () => {
    const targets = await collectGroupTargets(
      createContext({
        message: {
          id: 'message-id',
          from: '120@g.us',
          body: '',
          mentionedIds: ['123@lid'],
          hasMedia: false
        },
        services: {
          resolveMentionedContacts: async () => [{ id: '5511888888888@c.us', number: '5511888888888' }]
        }
      }),
      ''
    )

    expect(targets).toEqual([
      {
        id: '5511888888888@c.us',
        label: '@5511888888888',
        source: 'mention'
      }
    ])
  })

  it('collects quoted contacts and argument numbers without duplicates', async () => {
    const targets = await collectGroupTargets(
      createContext({
        quotedMessage: {
          id: 'quoted-id',
          from: '120@g.us',
          author: '5511777777777@c.us',
          body: '',
          hasMedia: false
        },
        services: {
          resolveTargetContact: async () => ({ id: '5511777777777@c.us', number: '5511777777777' })
        }
      }),
      '5511777777777 5511666666666'
    )

    expect(targets.map((target) => target.id)).toEqual(['5511777777777@c.us', '5511666666666@c.us'])
  })
})
