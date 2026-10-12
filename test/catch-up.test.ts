import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { pendingMessages, startOfToday } from '../src/whatsapp/catch-up.js'
import { CheckpointStore } from '../src/whatsapp/checkpoint.js'

const msg = (id: string, timestamp: number, fromMe = false) => ({ id: { _serialized: id }, from: 'x@c.us', timestamp, fromMe })

describe('catch-up', () => {
  it('only keeps incoming messages after the last bot reply', () => {
    const recent = [msg('a', 100), msg('b', 110, true), msg('c', 120), msg('d', 130)]
    expect(pendingMessages(recent, 0).map((m) => m.id._serialized)).toEqual(['c', 'd'])
  })

  it('ignores messages before since and the checkpoint message itself', () => {
    const recent = [msg('a', 100), msg('b', 200), msg('c', 300)]
    expect(pendingMessages(recent, 200, 'b').map((m) => m.id._serialized)).toEqual(['c'])
  })

  it('returns nothing when the bot replied last', () => {
    expect(pendingMessages([msg('a', 100), msg('b', 110, true)], 0)).toEqual([])
  })

  it('computes the start of the day in the given time zone', () => {
    // 2026-10-12 02:30 UTC = 2026-10-11 23:30 em São Paulo (UTC-3)
    const now = new Date('2026-10-12T02:30:00Z')
    expect(new Date(startOfToday('America/Sao_Paulo', now) * 1000).toISOString()).toBe('2026-10-11T03:00:00.000Z')
    expect(new Date(startOfToday('UTC', now) * 1000).toISOString()).toBe('2026-10-12T00:00:00.000Z')
  })
})

describe('CheckpointStore', () => {
  it('only moves forward and persists on flush', async () => {
    const file = join(mkdtempSync(join(tmpdir(), 'dbcp-')), 'checkpoint.json')
    const store = new CheckpointStore(file)
    store.record(msg('b', 200), 'Grupo')
    store.record(msg('a', 100), 'Outro')
    expect(store.get()).toMatchObject({ lastMessageAt: 200, lastMessageId: 'b', chatName: 'Grupo' })
    await store.flush()
    expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ lastMessageAt: 200 })
    expect(new CheckpointStore(file).get()).toMatchObject({ lastMessageId: 'b' })
  })
})
