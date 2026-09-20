import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import type { GroupConfigService } from '../../groups/group-config.service.js'
import { stickerMessages } from '../../messages/sticker.messages.js'
import { fetchTexasScremoji } from '../../services/texas/texas-api.service.js'
import type { StickerService } from '../../services/stickers/sticker.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'
import { applyGroupMetadata, resolveStickerOptions } from '../stickers/create-sticker.command.js'

// Tipo de respondivel registrado no ReplyableService para o seletor de fornecedor.
export const EMOJI_REPLYABLE_TYPE = 'fun.emoji.provider-selector'

type EmojiSelectorPayload = {
  emoji: string
  providers: Record<string, string>
}

// Matches exactly one emoji grapheme: flag (2 regional indicators), or a pictographic
// with optional modifier/VS16/keycap and optional ZWJ chain.
const SINGLE_EMOJI_RE = new RegExp(
  '^(?:[\\p{Regional_Indicator}]{2}' +
  '|\\p{Extended_Pictographic}(?:[\\p{Emoji_Modifier}\\uFE0F\\u20E3])?' +
  '(?:\\u200D\\p{Extended_Pictographic}(?:[\\p{Emoji_Modifier}\\uFE0F])?)*)$',
  'u'
)

// Finds the first emoji anywhere in a string (for parsing args like "microsoft 😤").
const EMOJI_IN_TEXT_RE = new RegExp(
  '(?:[\\p{Regional_Indicator}]{2}' +
  '|\\p{Extended_Pictographic}(?:[\\p{Emoji_Modifier}\\uFE0F\\u20E3])?' +
  '(?:\\u200D\\p{Extended_Pictographic}(?:[\\p{Emoji_Modifier}\\uFE0F])?)*)',
  'u'
)

type EmojiStickerServices = {
  stickers?: StickerService
  groupConfigs?: GroupConfigService
  sendReplyable?: (text: string, meta: { type: string; payload: unknown }) => Promise<void>
}

function isSingleEmoji(text: string): boolean {
  return SINGLE_EMOJI_RE.test(text.trim())
}

function normalizeProvider(name: string): string {
  return name.toLowerCase().replace(/[\s-]+/g, '_')
}

function parseArgs(argsText: string, body: string): { emoji: string | null; provider: string | null } {
  // Tenta no argsText: acha o primeiro emoji e trata o resto como nome do fornecedor.
  // Suporta "microsoft 😤", "😤 microsoft" ou apenas "😤".
  const match = EMOJI_IN_TEXT_RE.exec(argsText)
  if (match) {
    const emoji = match[0]
    const rest = (argsText.slice(0, match.index) + argsText.slice(match.index + emoji.length)).trim()
    return { emoji, provider: rest ? normalizeProvider(rest) : null }
  }
  // Fallback: emoji implicito (o corpo inteiro e um unico emoji).
  if (isSingleEmoji(body)) return { emoji: body, provider: null }
  return { emoji: null, provider: null }
}

async function sendEmojiSticker(
  ctx: CommandContext,
  imageUrl: string,
  services: EmojiStickerServices
): Promise<void> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const mimeType = res.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/png'

  const { metadata, options } = resolveStickerOptions(ctx.config.commands['sticker.create']?.config)
  const groupMetadata = applyGroupMetadata(metadata, ctx.chat, services.groupConfigs)
  const sticker = await services.stickers?.createSticker({ buffer, mimeType }, groupMetadata, { ...options, fit: 'contain' })
  if (!sticker) throw new Error('Sticker service unavailable')
  await ctx.replyWithSticker(sticker.buffer, sticker.mimeType)
}

/**
 * Handler chamado quando o usuario responde a mensagem do seletor de fornecedor.
 * Registrado no ReplyableService sob {@link EMOJI_REPLYABLE_TYPE}.
 */
export async function handleEmojiProviderReply(
  ctx: CommandContext,
  payload: EmojiSelectorPayload,
  replyText: string
): Promise<void> {
  const services = ctx.services as EmojiStickerServices
  const provider = normalizeProvider(replyText)
  const imageUrl = payload.providers[provider]
  if (!imageUrl) {
    await ctx.reply(`Fornecedor *${provider}* não encontrado.\nDisponíveis: ${Object.keys(payload.providers).join(', ')}`)
    return
  }
  try {
    await sendEmojiSticker(ctx, imageUrl, services)
  } catch {
    await ctx.reply(stickerMessages.creationFailed)
  }
}

export const emojiCommand = defineCommand({
  id: 'fun.emoji',
  group: 'fun',
  name: 'Emoji como figurinha',
  description: 'Envia a arte de um emoji como figurinha. Suporta Apple, Google, WhatsApp e outros fornecedores.',
  aliases: ['emoji', 'em'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 5,
  supports: {
    private: true,
    groups: true,
    implicit: true,
  },
  configFields: [],
  async match(ctx) {
    // Explicit: !emoji <emoji> (com ou sem fornecedor)
    if (matchesExplicitAlias(ctx, 'fun.emoji', emojiCommand.aliases)) return true
    // Implicit: corpo da mensagem e exatamente um emoji
    if (isSingleEmoji(ctx.message.body ?? '')) return true
    return false
  },
  async run(ctx) {
    const services = ctx.services as EmojiStickerServices

    const { emoji, provider } = parseArgs(
      ctx.parsedCommand?.argsText?.trim() ?? '',
      ctx.message.body?.trim() ?? ''
    )

    if (!emoji) {
      await ctx.reply('Manda um emoji junto ao comando ou envie uma mensagem com apenas um emoji.\nEx: *!emoji 🤐* ou *!emoji microsoft 🤐*')
      return
    }

    let providers: Record<string, string>
    try {
      providers = await fetchTexasScremoji(emoji)
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
      return
    }

    const providerNames = Object.keys(providers)
    if (providerNames.length === 0) {
      await ctx.reply('Nenhuma versão encontrada para esse emoji.')
      return
    }

    // Escolhe a arte: fornecedor informado tem prioridade, senao usa apple como padrao.
    let imageUrl: string
    if (provider) {
      const found = providers[provider]
      if (!found) {
        await ctx.reply(`Fornecedor *${provider}* não encontrado.\nDisponíveis: ${providerNames.join(', ')}`)
        return
      }
      imageUrl = found
    } else {
      imageUrl = providers['apple'] ?? providers[providerNames[0]]
    }

    try {
      await sendEmojiSticker(ctx, imageUrl, services)
    } catch {
      await ctx.reply(stickerMessages.creationFailed)
      return
    }

    // O catalogo (mensagem respondivel) e enviado SEMPRE que o comando roda:
    // implicito, explicito sem fornecedor ou explicito com fornecedor.
    // So e omitido quando o fluxo veio de uma resposta ao replyable (handleEmojiProviderReply).
    const selectorText =
      `${emoji} Essa figurinha tem *${providerNames.length} versões*:\n` +
      providerNames.join(' • ') + '\n\n' +
      `💡 Para receber em outra arte, mande:\n*!emoji <fornecedor> ${emoji}*\n` +
      `Ex: *!emoji microsoft ${emoji}*\n\n` +
      `Ou responda *esta mensagem* com o nome do fornecedor.`

    const payload: EmojiSelectorPayload = { emoji, providers }
    if (services.sendReplyable) {
      await services.sendReplyable(selectorText, { type: EMOJI_REPLYABLE_TYPE, payload })
    } else {
      await ctx.reply(selectorText)
    }
  }
})
