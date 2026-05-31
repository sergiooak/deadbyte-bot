import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'

interface EmojiHubResponse {
  name: string
  category: string
  group: string
  htmlCode: string[]
  unicode: string[]
}

function decodeHtmlEntity(entity: string): string {
  const match = entity.match(/&#(\d+);/)
  if (!match) return ''
  return String.fromCodePoint(parseInt(match[1], 10))
}

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

export const emojiCommand = defineCommand({
  id: 'fun.emoji',
  group: 'fun',
  name: 'Emoji',
  description: 'Retorna um emoji aleatório com seu nome e categoria.',
  aliases: ['emoji', 'em'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(normalized && aliasesFor(ctx, 'fun.emoji', emojiCommand.aliases).map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const response = await fetch('https://emojihub.yurace.pro/api/random')

    if (!response.ok) {
      await ctx.reply('Não foi possível obter um emoji no momento. Tente novamente.')
      return
    }

    const data = (await response.json()) as EmojiHubResponse
    const emoji = data.htmlCode.map(decodeHtmlEntity).join('')

    await ctx.reply(`${emoji}\n\nNome: ${data.name}\nCategoria: ${data.category}\nGrupo: ${data.group}`)
  }
})
