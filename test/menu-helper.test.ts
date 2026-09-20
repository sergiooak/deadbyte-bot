import type { DeadByteCommand, DeadByteCommandGroupDefinition } from '@deadbyte/runtime'
import { describe, expect, it } from 'vitest'
import { createSystemMenu } from '../src/commands/system/menu.helper.js'

const commands = [
  {
    id: 'sticker.create',
    group: 'sticker',
    name: 'Figurinha',
    aliases: ['figurinha', 'f'],
    description: 'Cria uma figurinha.',
  },
  {
    id: 'bible.get-verse',
    group: 'bible',
    name: 'Versiculo',
    aliases: ['versiculo'],
    description: 'Busca um versiculo biblico.',
  },
] as DeadByteCommand[]

const groups = [
  { id: 'sticker', title: 'Figurinhas', order: 1 },
  { id: 'bible', title: 'Biblia Sagrada', order: 2 },
] as DeadByteCommandGroupDefinition[]

describe('createSystemMenu', () => {
  it('filters commands by a group title argument', () => {
    const menu = createSystemMenu(commands, '.', {}, groups, 'figurinhas')

    expect(menu).toContain('*Figurinhas*')
    expect(menu).toContain('*.figurinha*')
    expect(menu).not.toContain('*Biblia Sagrada*')
    expect(menu).not.toContain('*.versiculo*')
  })

  it('filters commands by an accent-insensitive group title argument', () => {
    const menu = createSystemMenu(commands, '!', {}, groups, 'biblia')

    expect(menu).toContain('*Biblia Sagrada*')
    expect(menu).toContain('*!versiculo*')
    expect(menu).not.toContain('*Figurinhas*')
    expect(menu).not.toContain('*!figurinha*')
  })

  it('explains when the group argument does not match a visible group', () => {
    const menu = createSystemMenu(commands, '.', {}, groups, 'audio')

    expect(menu).toContain('audio')
    expect(menu).toContain('Figurinhas')
    expect(menu).toContain('Biblia Sagrada')
    expect(menu).not.toContain('*.figurinha*')
  })
})
