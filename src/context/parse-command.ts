import { normalizeCommandName, type ParsedCommand } from '@deadbyte/runtime'

export type ParseCommandOptions = {
  prefixes: string[]
  fallbackPrefixes: string[]
  botId?: string
}

function stripLeadingMentions(body: string): { body: string; mentioned: boolean } {
  const stripped = body.replace(/^(\s*@\S+\s+)+/, '').trimStart()
  return { body: stripped, mentioned: stripped !== body.trimStart() }
}

export function parseCommand(
  body: string,
  prefixes: string[],
  fallbackPrefixes: string[],
  options: Pick<ParseCommandOptions, 'botId'> = {}
): ParsedCommand {
  const original = body ?? ''
  const mentionResult = stripLeadingMentions(original)
  const candidate = mentionResult.body.trimStart()
  const allPrefixes = [...prefixes, ...fallbackPrefixes]
  const prefix = allPrefixes.find((value) => candidate.startsWith(value))

  if (prefix) {
    const withoutPrefix = candidate.slice(prefix.length).trimStart()
    const [rawName = '', ...args] = withoutPrefix.split(/\s+/)
    return {
      explicit: true,
      prefix,
      rawName,
      normalizedName: normalizeCommandName(rawName),
      argsText: args.join(' '),
      source: mentionResult.mentioned || options.botId ? 'mention' : 'message'
    }
  }

  if (mentionResult.mentioned) {
    const [rawName = '', ...args] = candidate.split(/\s+/)
    return {
      explicit: true,
      rawName,
      normalizedName: normalizeCommandName(rawName),
      argsText: args.join(' '),
      source: 'mention'
    }
  }

  const [rawName = '', ...args] = original.trim().split(/\s+/)
  return {
    explicit: false,
    rawName,
    normalizedName: normalizeCommandName(rawName),
    argsText: args.join(' '),
    source: 'implicit'
  }
}
