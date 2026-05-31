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

export const reactCommand = defineCommand({
  id: 'fun.react',
  group: 'fun',
  name: 'React',
  description: 'Reage à mensagem com um emoji aleatório.',
  aliases: ['react', 'reacao', 'reagir'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    if (ctx.message.body === '.') return true
    const normalized = ctx.parsedCommand?.normalizedName
    return Boolean(normalized && aliasesFor(ctx, 'fun.react', reactCommand.aliases).map(normalizeCommandName).includes(normalized))
  },
  async run(ctx) {
    const response = await fetch('https://emojihub.yurace.pro/api/random')

    if (!response.ok) {
      await ctx.reply('Não foi possível obter um emoji no momento. Tente novamente.')
      return
    }

    const data = (await response.json()) as EmojiHubResponse
    // Use only the base codepoint (first htmlCode) to maximise reaction compatibility
    const emoji = decodeHtmlEntity(data.htmlCode[0])

    await ctx.react(emoji)
  }
})
