export interface EmojiHubResponse {
  name: string
  category: string
  group: string
  htmlCode: string[]
  unicode: string[]
}

export function decodeHtmlEntity(entity: string): string {
  const match = entity.match(/&#(\d+);/)
  if (!match) return ''
  return String.fromCodePoint(parseInt(match[1], 10))
}

export function aliasesFor(
  ctx: { config: { commands: Record<string, { aliases?: string[] }> } },
  commandId: string,
  defaults: string[]
): string[] {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

export async function fetchRandomEmoji(): Promise<EmojiHubResponse | null> {
  const response = await fetch('https://emojihub.yurace.pro/api/random')
  if (!response.ok) return null
  return (await response.json()) as EmojiHubResponse
}
