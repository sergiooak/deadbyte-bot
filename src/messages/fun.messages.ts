export const funMessages = {
  bootCorrection: `{{🤓☝️ Na real,|☝️ Só um ajuste antes que isso vire crime ortográfico:|🤓 Pequena correção, já que aparentemente sobrou pra mim:|☝️ O corretor dormiu, então vamos lá:} {o certo é|o correto é|se escreve} *bot*{.|!}|{🤓☝️ Você quis dizer} *bot*{, né?|?}|{☝️ Vou fingir que foi o teclado:} é *bot*{.|!}|{🤓 Tecnicamente, e infelizmente pra sua mensagem,} é *bot*{.|...}}

{Leia, já que chegamos nesse ponto:|Fonte, porque até bot precisa se defender:|Referência básica pra salvar o grupo:} https://pt.wikipedia.org/wiki/Bot`,
  emojiUnavailable:
    '{Não consegui|Falhei tentando} pegar um emoji {agora|no momento}. {Tenta de novo daqui a pouco|Pode tentar outra vez, porque até emoji some quando precisa|A API deu aquela valorizada no próprio silêncio}.',
  emojiResult(emoji: string, name: string, category: string, group: string): string {
    return `${emoji}\n\n*{Nome|Chamam de|RG do bonito}:* ${name}\n*{Categoria|Família}:* ${category}\n*{Grupo|Panelinha}:* ${group}`
  },
  coinSingle(result: 'cara' | 'coroa'): string {
    return `{🪙|Cara ou coroa no modo alta tecnologia:} Deu *${result}*{.|, pronto, mistério resolvido.|. Impressionante o avanço da ciência.}`
  },
  coinMany(coinCount: number, heads: number, tails: number, details: string): string {
    return `{🪙|📊} *${coinCount} moedas*: ${heads} cara, ${tails} coroa. {Tá aí a auditoria inútil|Relatório completo, porque aparentemente precisava|Planilha emocional entregue}.\n\n${details}`
  },
  diceInvalid:
    '{🎲|🧮} {Manda|Informa|Joga aí} uma expressão de dado válida, {porque esse hieróglifo aí não rolou|já que dado não lê pensamento ainda}.\n\nExemplos:\n• `!2d6+3` — 2 dados de 6 lados, +3\n• `!d20` — 1 dado de 20 lados\n• `!dado 4d6` — 4 dados de 6 lados',
  diceCriticalNote: '{✨ crítico!|✨ tirou o máximo!|✨ bonito, agora vai achar que tem sorte.}',
  diceFumbleNote: '{💀 falha crítica!|💀 o mínimo possível, parabéns pelo desastre.|💀 o dado te olhou e desistiu.}',
  diceRoll(total: string, details: string): string {
    return details ? `{🎲|🧮} *${total}*\n${details}` : `{🎲|🧮} *${total}*`
  },
  mathInvalid:
    '{🧮|📐} Não consegui calcular essa expressão, {e olha que eu tentei com boa vontade|então vamos fingir que foi culpa da sintaxe}.\n\nExemplos válidos:\n• `1 + 2 * 3`\n• `(4 + 6) / 2`\n• `2 ^ 3 ^ 2`\n• `1 + 1 = 2` (validação)\n• `1 + 1 = 3` (retorna Errado)\n• `40% de 250` · `raiz cúbica de 27` · `6³`',
  mathCheckedResult(explanation: string): string {
    return `{Conferi aqui|Fiz a conta|Passei a régua matemática, olha só}:\n${explanation}`
  },
  mathResult(explanation: string): string {
    return `{🧮|📐|🔢} ${explanation}`
  }
}
