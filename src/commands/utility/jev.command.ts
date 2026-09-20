import { defineCommand, type CommandContext } from '@deadbyte/runtime'
import { askJevChoice, askJevYesNo, type JevChoiceResult, type JevNoulResult } from '../../services/jev/jev-api.service.js'
import { NO_KEY, YES_KEY, parseQuestion, type ParsedQuestion } from '../../services/jev/question-parser.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'
import { escapeSpintax, spintaxFromVariants } from '../../utils/spintax.js'

// Deboche de reserva quando o parser nao devolve comentario para o resultado.
const FALLBACK_COMMENT = ['Tá decidido, sem choro.', 'É isso e pronto, confia no Jev.', 'Reclamação? Fala com o Jev.']
// Emojis de reserva para identificar opcoes quando o parser nao devolve um.
const FALLBACK_YES_EMOJI = '✅'
const FALLBACK_NO_EMOJI = '❌'
const FALLBACK_OPTION_EMOJIS = ['🔵', '🔴', '🟢', '🟡', '🟣', '🟠']

type JevInput = {
  question: string
  context: string | null
}

/**
 * Descobre a pergunta e o contexto a partir dos argumentos e do texto citado.
 * Com argumentos, o texto citado (quando houver) vira contexto; sem argumentos,
 * a propria mensagem citada vira a pergunta.
 */
function resolveInput(argsText: string, quotedText: string): JevInput | null {
  if (argsText) return { question: argsText, context: quotedText || null }
  if (quotedText) return { question: quotedText, context: null }
  return null
}

function toPercent(probability: number): number {
  return Math.round(probability * 100)
}

function bold(text: string, active: boolean): string {
  const escaped = escapeSpintax(text)
  return active ? `*${escaped}*` : escaped
}

/** Bloco spintax do deboche para uma chave de resultado (com fallback). */
function commentFor(parsed: ParsedQuestion, key: string): string {
  return spintaxFromVariants(parsed.comments[key] ?? FALLBACK_COMMENT)
}

function formatYesNo(parsed: ParsedQuestion, result: JevNoulResult): string {
  const isYes = result.probability >= 0.5
  const yesPct = toPercent(result.probability)
  const yesSide = { label: 'Sim', pct: yesPct, emoji: parsed.emojis[YES_KEY] ?? FALLBACK_YES_EMOJI, won: isYes }
  const noSide = { label: 'Não', pct: 100 - yesPct, emoji: parsed.emojis[NO_KEY] ?? FALLBACK_NO_EMOJI, won: !isYes }
  // Vencedor primeiro (emoji do vencedor lidera, do perdedor fecha).
  const [first, second] = isYes ? [yesSide, noSide] : [noSide, yesSide]
  const scoreboard = `${first.emoji} ${bold(first.label, first.won)} ${first.pct}% × ${second.pct}% ${bold(second.label, second.won)} ${second.emoji}`
  return `${scoreboard}\n\n${commentFor(parsed, isYes ? YES_KEY : NO_KEY)}`
}

function formatChoice(parsed: ParsedQuestion, result: JevChoiceResult): string {
  const items = result.ranked.map((item, index) => {
    const emoji = parsed.emojis[item.option] ?? FALLBACK_OPTION_EMOJIS[index % FALLBACK_OPTION_EMOJIS.length]
    return `${emoji} ${bold(item.option, item.option === result.choice)} ${toPercent(item.probability)}%`
  })
  // Ate 2 opcoes cabem numa linha; 3+ ficam uma por linha.
  const scoreboard = items.length <= 2 ? items.join(' × ') : items.join('\n')
  return `${scoreboard}\n\n${commentFor(parsed, result.choice)}`
}

export const jevCommand = defineCommand({
  id: 'utility.jev',
  group: 'utility',
  name: 'Jev (pergunte à IA)',
  description: 'Faça uma pergunta de sim/não ou com opções e o Jev decide — com deboche. Responda uma mensagem para usá-la como contexto.',
  aliases: ['jev', 'jeff', 'pergunta', 'pergunte', 'decide', 'decidir'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'utility.jev', jevCommand.aliases)
  },
  async run(ctx) {
    const argsText = ctx.parsedCommand?.argsText?.trim() ?? ''
    const quotedText = ctx.quotedMessage?.body?.trim() ?? ''

    // O Jev só lê texto. Se o usuário respondeu a uma mensagem sem texto
    // (mídia sem legenda), não dá para usar como contexto: avisa e sai.
    if (ctx.quotedMessage && !quotedText) {
      await ctx.reply('O Jev só entende *texto*. Responda a uma mensagem de texto (ou mande a pergunta escrita) e chame o *!jev* de novo.')
      return
    }

    const input = resolveInput(argsText, quotedText)
    if (!input) {
      await ctx.reply(
        'Me faça uma pergunta que o Jev decide.\n' +
        '• Sim/não: *!jev vai chover amanhã?*\n' +
        '• Com opções: *!jev pizza ou hambúrguer?*\n' +
        '• Respondendo uma mensagem: *!jev isso foi sarcástico?*'
      )
      return
    }

    // 1) Modelo barato monta a pergunta, os emojis e os debochos por resultado.
    let parsed: ParsedQuestion
    try {
      parsed = await parseQuestion(input.question, input.context)
    } catch {
      await ctx.reply('Não consegui entender a pergunta agora. Tenta de novo em instantes.')
      return
    }

    // 2) Jev decide (Noul para sim/não, Choice quando há opções). O texto citado,
    //    quando existe, vai como estado para o Jev julgar.
    //    A resposta carrega spintax; o ctx.reply renderiza (sorteia a variação do deboche).
    try {
      if (parsed.type === 'choice') {
        const result = await askJevChoice(parsed.question, parsed.options, input.context)
        await ctx.reply(formatChoice(parsed, result))
      } else {
        const result = await askJevYesNo(parsed.question, input.context)
        await ctx.reply(formatYesNo(parsed, result))
      }
    } catch {
      await ctx.reply('O Jev não respondeu agora. Tenta de novo em instantes.')
    }
  }
})
