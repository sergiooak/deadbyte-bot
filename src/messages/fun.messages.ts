// 
// ===== Constants =====================================================================================================
// 

const casualPrefix =
  '{|{Pô|Poxa|Porra|Se liga|Uai} {véi|mano|bro|brother|bixo|bicho}{| kk}{||!|}\n\n}'

const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

const sentenceEnd =
  '{|.|!|!!|!!!| uai| kk}'

// 
// ===== Main export ==================================================================================================
// 

export const funMessages = {
  // ── Emoji ──────────────────────────────────────────────────────────────────

  emojiUnavailable:
    `${errorPrefix}⚠️ {Não consegui|Deu ruim ao|Falhei ao} pegar esse emoji agora${sentenceEnd}{| {A API de emojis resolveu tirar folga|Até a API de emoji me ignorou hoje|Tenta de novo daqui a pouco}${sentenceEnd}}`,

  emojiResult(emoji: string, name: string, category: string, group: string): string {
    return `${emoji}\n\n` +
      `*{Nome|O nome oficial é}:* ${name}\n` +
      `*{Categoria}:* ${category}\n` +
      `*{Grupo}:* ${group}`
  },

  // ── Moeda ──────────────────────────────────────────────────────────────────

  coinSingle(result: 'cara' | 'coroa'): string {
    return `🪙{| Cara ou Coroa?\n\n} Deu *${result}*{|{.|!|!!|!!!} {|{E aí?}{| Feliz?| Era {oq|o que|o quê} queria?}}}`
  },

  coinMany(coinCount: number, heads: number, tails: number, details: string): string {
    return `🪙 {Joguei|Lancei} *${coinCount} moedas* no ar: foram ${heads} caras e ${tails} coroas{|.|!|!!|!!!}\n\n{Confere aí:|Toma aí:|Olha a listagem:|Segue detalhamento:}\n\n${details}`
  },

  // ── Dado ───────────────────────────────────────────────────────────────────

  diceInvalid:
    `${casualPrefix}🎲 {Expressão inválida|Não reconheci essa rolagem|Isso aí não serve}. {Manda|Joga aí} {algo que eu entenda|uma expressão válida}.\n\n` +
    `{Exemplos|Tipo assim|Assim ó}:\n` +
    `• \`!2d6+3\` — 2 dados de 6 lados +3\n` +
    `• \`!d20\` — 1 dado de 20 lados\n` +
    `• \`!dado 4d6\` — 4 dados de 6 lados`,

  diceCriticalNote: '✨{| {Crítico|Máximo possível|Não podia ser melhor|Perfeito}{|!|!!|!!!}}',

  diceFumbleNote: '💀{| {Falha crítica|Mínimo possível|Não podia ser pior|Foi mal}{|!|!! kk|!!!}}',

  diceRoll(total: string, details: string): string {
    return details
      ? `🎲{| {Vc|Você|Ocê} rolou| Total:| Deu} *${total}*\n${details}`
      : `🎲{| {Vc|Você|Ocê} rolou| Foi| Deu} *${total}*`
  },

  // ── Correção de boot ───────────────────────────────────────────────────────

  bootCorrection:
    `{🤓☝️|🤓|☝️} {Na {real|verdade},|{Apenas uma correção|Só um ajuste rápido}{| (antes que o Pasquale apareça)}:|O seu corretor falhou de novo kk:} o {certo|correto} é *bot*{.|!}\n\n` +
    `{Fonte{| (se não acredita em mim kk)}:|Leia aí:}\nhttps://pt.wikipedia.org/wiki/Bot`,
}
