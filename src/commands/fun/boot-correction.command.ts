import { defineCommand } from '@deadbyte/runtime'
import { matchesExplicitAlias } from '../../utils/commands.js'

const CORRECTION_MESSAGE = `{{🤓☝️ Actually,|🤓☝️ Na real,|☝️ Só um microfavor à ortografia,|🤓 Pequena correção antes que isso vire jurisprudência:|☝️ Correção não solicitada, mas necessária:|🤓☝️ Momento chato, porém tecnicamente correto:} {o certo é|o correto é|se escreve|a forma civilizada é} *bot*{!|!!|.}|{🤓☝️ Você quis dizer} *bot*{?|??|, né?}|{🤓☝️ Acho que você quis dizer|☝️ Talvez você tenha querido dizer|🤓 Vou fingir que você quis dizer} *bot*{.|...|, pelo bem de todos.}|{🤓☝️ Actually,} *bot* é {a forma correta|como se escreve corretamente|o jeito menos criminoso de escrever}{!|!!|.}|{☝️ Só passando para impedir esse pequeno acidente gramatical:} é *bot*{.|...}|{🤓 Correçãozinha básica, porque aparentemente hoje sou o fiscal do teclado:} *bot*{.|!}|{☝️ Antes que o dicionário abra um BO:} é *bot*{.|!}|{🤓☝️ Tecnicamente, e infelizmente para você,} é *bot*{.|...}|{☝️ Pelo amor da precisão desnecessária:} *bot*{.|!}|{🤓☝️ Não querendo ser essa pessoa, já sendo:} o certo é *bot*{.|!}|{☝️ Isso aqui doeu um pouco, então vamos ajustar:} *bot*{.|...}|{🤓☝️ Pequeno lembrete hostilmente educativo:} se escreve *bot*{.|!}|{☝️ O corretor automático falhou, mas eu não:} é *bot*{.|!}}

{Leia:|Para mais informações, veja:|Leia mais sobre isso em:|Fonte, porque aparentemente precisamos disso:|Dá uma lida ai: (vc ta precisando kk)|Recomendo a leitura:|Referência, já que chegamos nesse ponto:|Bibliografia mínima para sobreviver ao debate:|Wikipédia:|De uma lida:|Lê ai parça:} https://pt.wikipedia.org/wiki/Bot`;

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
    if (matchesExplicitAlias(ctx, 'fun.boot-correction', bootCorrectionCommand.aliases)) {
      return true
    }

    return messageContainsWord(ctx.message.body, 'boot')
  },
  async run(ctx) {
    const reply = ctx.reply as ReplyWithOptions
    await reply(CORRECTION_MESSAGE, { linkPreview: false })
  }
})
