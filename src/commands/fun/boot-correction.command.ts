import { defineCommand, normalizeCommandName } from '@deadbyte/runtime'

const correctionResponses = [
  '{Opa!|Oops!} {certo|correto} e *bot*{!|!!|!!!}',
  '{Na verdade|A proposito}, {e|se escreve} *bot*{!|!!|!!!}',
  '{So para corrigir|Para sua informacao}, {o correto|o certo} e *bot*{!|!!|!!!}',
  '{Voce quis dizer|Voce queria dizer} *bot*{?|??|???}',
  '{Acho que voce quis dizer|Talvez voce tenha querido dizer}: *bot*{?|??|???}',
  '*{Bot|Bot}* e {a forma correta|como se escreve corretamente}{!|!!|!!!}'
]

const correctionFooters = [
  'Para mais informacoes, veja:',
  'Leia mais sobre isso em:',
  'Para saber mais, acesse:'
]

const wikipediaUrl = 'https://pt.wikipedia.org/wiki/Bot'

type ReplyWithOptions = (text: string, options?: Record<string, unknown>) => Promise<void>

function aliasesFor(ctx: { config: { commands: Record<string, { aliases?: string[] }> } }, commandId: string, defaults: string[]) {
  return ctx.config.commands[commandId]?.aliases ?? defaults
}

export function messageContainsWord(messageBody: string | undefined, word: string): boolean {
  if (!messageBody) {
    return false
  }

  const normalizedWord = word.toLowerCase()
  const wordsInMessage = messageBody.split(' ')
  return wordsInMessage.some((messageWord) => messageWord.toLowerCase().replace(/[^a-zA-Z]/g, '') === normalizedWord)
}

function createCorrectionMessage(): string {
  const randomResponse = correctionResponses[Math.floor(Math.random() * correctionResponses.length)] ?? correctionResponses[0]
  const randomFooter = correctionFooters[Math.floor(Math.random() * correctionFooters.length)] ?? correctionFooters[0]
  return `- ${randomResponse}\n\n${randomFooter} ${wikipediaUrl}`
}

export const bootCorrectionCommand = defineCommand({
  id: 'fun.boot-correction',
  group: 'fun',
  name: 'Correcao boot/bot',
  description: 'Corrige mensagens que chamam o bot de boot.',
  aliases: ['boot'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: true
  },
  configFields: [],
  async match(ctx) {
    const normalized = ctx.parsedCommand?.normalizedName
    if (
      ctx.parsedCommand?.explicit &&
      normalized &&
      aliasesFor(ctx, 'fun.boot-correction', bootCorrectionCommand.aliases).map(normalizeCommandName).includes(normalized)
    ) {
      return true
    }

    return messageContainsWord(ctx.message.body, 'boot')
  },
  async run(ctx) {
    const reply = ctx.reply as ReplyWithOptions
    await reply(createCorrectionMessage(), { linkPreview: false })
  }
})
