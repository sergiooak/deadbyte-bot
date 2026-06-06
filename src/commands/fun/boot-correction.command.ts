import { defineCommand } from '@deadbyte/runtime'
import { funMessages } from '../../messages/fun.messages.js'
import { matchesExplicitAlias } from '../../utils/commands.js'

type ReplyWithOptions = (text: string, options?: Record<string, unknown>) => Promise<void>

export function messageContainsWord(messageBody: string | undefined, word: string): boolean {
  if (!messageBody) {
    return false
  }

  const normalizedWord = word.toLowerCase()
  const wordsInMessage = messageBody.split(' ')
  return wordsInMessage.some((messageWord) => messageWord.toLowerCase().replace(/[^a-zA-Z]/g, '') === normalizedWord)
}

export const bootCorrectionCommand = defineCommand({
  id: 'fun.boot-correction',
  group: 'fun',
  name: 'Correção boot/bot',
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
    if (matchesExplicitAlias(ctx, 'fun.boot-correction', bootCorrectionCommand.aliases)) {
      return true
    }

    return messageContainsWord(ctx.message.body, 'boot')
  },
  async run(ctx) {
    const reply = ctx.reply as ReplyWithOptions
    await reply(funMessages.bootCorrection, { linkPreview: false })
  }
})
