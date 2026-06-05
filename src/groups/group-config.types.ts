export const GROUP_CONFIG_BOOLEAN_KEYS = ['welcome', 'goodbye', 'sticker'] as const
export const GROUP_CONFIG_STRING_KEYS = ['autor', 'pacote'] as const

export type GroupConfigBooleanKey = (typeof GROUP_CONFIG_BOOLEAN_KEYS)[number]
export type GroupConfigStringKey = (typeof GROUP_CONFIG_STRING_KEYS)[number]
export type GroupConfigKey = GroupConfigBooleanKey | GroupConfigStringKey

export type GroupConfig = Record<GroupConfigBooleanKey, boolean> & Record<GroupConfigStringKey, string | undefined>

export const DEFAULT_GROUP_CONFIG: GroupConfig = {
  welcome: false,
  goodbye: false,
  sticker: false,
  autor: undefined,
  pacote: undefined
}

// Exemplos futuros ainda nao implementados no parser/runtime de grupos:
// ai, ocr, ranking, games, music, downloads, antilink, antispam, antiflood,
// nsfw, lang, prefix, transcription, commands.
export const FUTURE_GROUP_CONFIG_KEYS = [
  'ai',
  'ocr',
  'ranking',
  'games',
  'music',
  'downloads',
  'antilink',
  'antispam',
  'antiflood',
  'nsfw',
  'lang',
  'prefix',
  'transcription',
  'commands'
] as const
