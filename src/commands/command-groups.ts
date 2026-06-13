import { defineCommandGroup } from '@deadbyte/runtime'

export const stickerGroup = defineCommandGroup({
  id: 'sticker',
  emoji: '🎨',
  title: 'Figurinhas',
  order: 1,
})

export const funGroup = defineCommandGroup({
  id: 'fun',
  emoji: '😄',
  title: 'Diversão',
  order: 2,
})

export const utilityGroup = defineCommandGroup({
  id: 'utility',
  emoji: '🔎',
  title: 'Utilitários',
  order: 3,
})

export const groupGroup = defineCommandGroup({
  id: 'group',
  emoji: '👥',
  title: 'Grupo',
  order: 4,
})

export const systemGroup = defineCommandGroup({
  id: 'system',
  emoji: '⚙️',
  title: 'Sistema',
  order: 5,
})

export const commandGroups = [stickerGroup, funGroup, utilityGroup, groupGroup, systemGroup]
