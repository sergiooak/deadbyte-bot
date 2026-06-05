import {
  DEFAULT_GROUP_CONFIG,
  GROUP_CONFIG_BOOLEAN_KEYS,
  GROUP_CONFIG_STRING_KEYS,
  type GroupConfig,
  type GroupConfigBooleanKey,
  type GroupConfigStringKey
} from './group-config.types.js'

const DB_BLOCK_PATTERN = /(?:^|\r?\n)#db(?:[ \t]+[^\r\n]*)?(?=\r?\n|$)/i
const TOKEN_PATTERN = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g
const BOOLEAN_ALIASES: Record<string, GroupConfigBooleanKey> = {
  welcome: 'welcome',
  goodbye: 'goodbye',
  sticker: 'sticker',
  autosticker: 'sticker'
}
const STRING_ALIASES: Record<string, GroupConfigStringKey> = {
  autor: 'autor',
  author: 'autor',
  pacote: 'pacote',
  pack: 'pacote',
  package: 'pacote'
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]/g, '')
}

function cleanToken(value: string): string {
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

export function mergeGroupConfig(overrides: Partial<GroupConfig> = {}): GroupConfig {
  return {
    ...DEFAULT_GROUP_CONFIG,
    ...overrides
  }
}

export function parseGroupConfigBlock(block: string | undefined): GroupConfig {
  const config = mergeGroupConfig()
  if (!block) return config

  const line = block.trim().replace(/^#db\b/i, '').trim()
  const tokens = line.match(TOKEN_PATTERN) ?? []

  for (const rawToken of tokens) {
    const token = cleanToken(rawToken)
    if (!token) continue

    const equalsIndex = token.indexOf('=')
    if (equalsIndex >= 0) {
      const key = STRING_ALIASES[normalizeKey(token.slice(0, equalsIndex))]
      if (key) {
        config[key] = token.slice(equalsIndex + 1)
      }
      continue
    }

    const disabled = token.startsWith('-')
    const key = BOOLEAN_ALIASES[normalizeKey(disabled ? token.slice(1) : token)]
    if (key) {
      config[key] = !disabled
    }
  }

  return config
}

export function parseGroupConfigFromDescription(description: string | undefined): GroupConfig {
  const block = description?.match(DB_BLOCK_PATTERN)?.[0]
  return parseGroupConfigBlock(block)
}

export function serializeGroupConfig(config: GroupConfig): string {
  const merged = mergeGroupConfig(config)
  const tokens: string[] = []

  for (const key of GROUP_CONFIG_BOOLEAN_KEYS) {
    tokens.push(merged[key] ? key : `-${key}`)
  }

  for (const key of GROUP_CONFIG_STRING_KEYS) {
    if (merged[key] !== undefined) {
      tokens.push(`${key}=${merged[key]}`)
    }
  }

  return `#db ${tokens.join(' ')}`
}

export function upsertGroupConfigBlock(description: string | undefined, config: GroupConfig): string {
  const withoutBlock = (description ?? '').replace(DB_BLOCK_PATTERN, '').trimEnd()
  const block = serializeGroupConfig(config)

  return withoutBlock ? `${withoutBlock}\n${block}` : block
}
