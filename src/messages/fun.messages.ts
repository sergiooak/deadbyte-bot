// 
// ===== Contants =====================================================================================================
// 

const actuallyEmojiPrefix = "{🤓☝️|🤓|☝️}"

const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

const sentenceEnd =
  '{|.|!|!!|!!!| uai| kk}'

// 
// ===== Main export ==================================================================================================
// 

export const funMessages = {
  bootCorrection:
    `${actuallyEmojiPrefix} {Na {real|verdade},|{Apenas uma correção|Só um ajuste rápido|Pequena correção}{| (antes que o professor Pasquale venha aqui)}:|O seu corretor não funcionou de novo kk:} o {certo|correto} é *bot*{.|!}\n\n` +
    `{Fonte{| (se não acredita em mim kk)}:|Leia aí{| (ta precisando)}:}\nhttps://pt.wikipedia.org/wiki/Bot`,

  emojiUnavailable:
    `${errorPrefix}{Não consegui|Deu ruim{| ao}{| tentar}|Falhei{| bonito| miseravelmente}{| tentando}} pegar esse emoji agora{.|!}{|{A API de emojis aleatórios resolveu tirar um cochilo|Até a API de emoji tá me ignorando hoje|Tenta de novo daqui a pouco}${sentenceEnd}}`,

  emojiResult(emoji: string, name: string, category: string, group: string): string {
    return `${emoji}\n\n` +
      `*{Nome|O nome oficial dele é|Oficialmente o nome dele é}:* ${name}\n` +
      `*{Categoria|A categoria é}:* ${category}\n` +
      `*{Grupo|O grupo é}:* ${group}`
  },

  coinSingle(result: 'cara' | 'coroa'): string {
    return `🪙{| Cara ou Coroa?\n\n} Deu *${result}*{|{.|!|!!|!!!} {|{|E aí?}{| Feliz?| Era {oq|o que|o quê} queria?}}}`
  },

  coinMany(coinCount: number, heads: number, tails: number, details: string): string {
    return `🪙 {|Cara ou Coroa?\n\n}{Joguei|Lancei} *${coinCount} moedas* no ar: foram ${heads} caras e ${tails} coroas{|.|!|!!|!!!}}\n\n{Confere aí:|Toma aí:|Olha a listagem:|Segue detalhamento:}\n\n${details}`
  },

  diceInvalid:
    `${errorPrefix}{|Ta errado esse comando aí{.|!| ein?}} {Manda|Joga aí} {uma expressão de válida|um comando válido}.\n\n` +
    `{Exemplos|Tipo assim|Assim ó}:\n` +
    `• \`!2d6+3\` — 2 dados de 6 lados +3\n` +
    `• \`!d20\` — 1 dado de 20 lados\n` +
    `• \`!dado 4d6\` — 4 dados de 6 lados`,

  diceCriticalNote: '✨{| {Crítico|Máximo possível|Não podia ser melhor|Perfeito|Tirou o máximo}{||!|!!|!!!}}',

  diceFumbleNote: '💀{| {Falha crítica|Mínimo possível|Não podia ser pior|O pior resultado|Foi mal|Se fudeo}{||| kk|!|!!|!!!}}',

  diceRoll(total: string, details: string): string {
    return details
      ? `🎲{| {Vc|Você|Ocê} rolou| Total deu| O total foi| Deu} *${total}*\n${details}`
      : `🎲{| {Vc|Você|Ocê} rolou| Foi| Deu} *${total}*`
  },

}
