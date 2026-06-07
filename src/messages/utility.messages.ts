// 
// ===== Constants =====================================================================================================
// 

const casualPrefix =
  '{|{Pô|Poxa|Porra|Se liga|Uai} {véi|mano|bro|brother|bixo|bicho}{| kk}{||!|}\n\n}'

const sentenceEnd =
  '{|.|!|!!|!!!| uai| kk}'

// 
// ===== Main export ==================================================================================================
// 


export const utilityMessages = {
  // ── DDD ────────────────────────────────────────────────────────────────────

  dddMissingInput:
    '{📌|ℹ️} {Manda|Informa|Solta} um DDD, responde {a mensagem de }alguém ou marca a pessoa 🙃. {Ex:|Exemplo, já que aparentemente precisa:|Tipo assim:} *!ddd 34*{| — não é difícil, juro 😌}',

  dddInternational(label: string, ddi: string): string {
    return `${casualPrefix}🌍 *${label}*: {{isso aí tem cara de número gringo|esse número chegou de fora com mala despachada|isso aí está com sotaque internacional}, meu {consagrado|nobre|chapa}. DDD é coisa {de BR|do Brasil} 🇧🇷, então usa *!ddi +${ddi}* e {para de nacionalizar número na marra 😌|aceita que o mundo é maior que o +55 🙃|vamos cada comando no seu quadrado 😇}.}`
  },

  dddInvalid(label: string): string {
    return `${casualPrefix}🔢 *${label}*: {me dá um DDD válido com 2 dígitos|DDD tem 2 dígitos, tecnologia antiga porém funcional|manda um DDD com 2 dígitos e poupa nós dois} 😌. Ex: *!ddd 34*`
  },

  dddNotFound(label: string, ddd: string): string {
    return `🔍 *${label}*: {DDD *${ddd}* não foi encontrado|Procurei o DDD *${ddd}* e nada apareceu|Esse DDD *${ddd}* não consta no mapa civilizado da telefonia}. {Ou é inválido 🙃|Ou a telefonia brasileira inventou DLC e não me avisou 😌|Ou o teclado fez arte de novo 😇}`
  },

  dddResult(ddd: string, stateName: string, state: string, cityCount: number, cityList: string): string {
    return `{📍|☎️|📞} *{DDD|Código|Discagem Direta a Distância} ${ddd}* — ${stateName} (${state})\n\n{🏙️|🌆|🌃} *{Cidades|Municípios|Localidades} ({${cityCount}|total de ${cityCount}|${cityCount} no total}):* ${cityList}\n\n{Tá aí o mapa telefônico 😌|Saiu a lista, pode comemorar 🙃|Missão cumprida, segue o baile 😇}`
  },

  // ── DDI ────────────────────────────────────────────────────────────────────

  ddiMissingInput:
    '{📌|ℹ️} {Manda|Informa|Solta} um DDI, responde {a mensagem de alguém|alguém} ou marca {a pessoa|o gringo} 🌍. {Ex:|Exemplo, já que aparentemente precisa:|Tipo assim:} *!ddi 52*{| — simples assim 😌}',

  ddiBrazilian(label: string, ddd?: string): string {
    return `${casualPrefix}🇧🇷 *${label}*: {{isso é número BR|esse número aí é brasileiro com firma reconhecida|isso aí tem CPF telefônico}, meu {nobre|chapa|consagrado}. O DDI dele é +55 e o que você quer de verdade é *!ddd ${ddd ?? 'XX'}*. {Usa o comando certo 😌|Cada comando no seu quadrado 🙃|A burocracia agradece 😇}.}`
  },

  ddiLocalWithoutCountry(label: string): string {
    return `${casualPrefix}🤔 *${label}*: {número sem DDI não dá pra adivinhar país, campeão 🙃|sem DDI na frente eu não tenho bola de cristal 🔮|número sem DDI é pedir adivinhação em horário comercial 😌}. {Manda com + na frente, tipo *!ddi +351...*|Coloca um + na frente e tudo fica mais fácil, prometo}.`
  },

  ddiInvalid(label: string): string {
    return `${casualPrefix}🔢 *${label}*: {me entrega um DDI válido de 1 a 4 dígitos 😌|manda um DDI com 1 a 4 dígitos|preciso de um DDI minimamente real 🙃}. {Do jeito que veio, até a antena pediu demissão 😇|Assim não rola, o mapa fica ofendido 😌}`
  },

  ddiNotFound(ddi: string): string {
    return `🔍 {DDI *+${ddi}* não foi encontrado|Procurei o DDI *+${ddi}* e nada|Esse DDI *+${ddi}* não apareceu no radar internacional}. {Ou é inválido 🙃|Ou o mapa tirou folga 😌|Ou a geografia resolveu complicar 😇}`
  },

  ddiSingleResult(ddi: string, country: string): string {
    return `{🌍|☎️|🌐} *{DDI|Código|Discagem} +${ddi}* {—|➜} ${country}{| 😌| — encontrado, ufa 🙃}`
  },

  ddiSharedResult(ddi: string, countryCount: number, countryList: string): string {
    return `{🌍|☎️|🌐} *{DDI|Código} +${ddi}* {é compartilhado por|pertence a|está associado a} ${countryCount} {países/territórios|lugares no mapa} 🗺️:\n\n${countryList}\n\n{Muita gente pra um DDI só 😌|O mundo é pequeno 🙃|Escolhe um 😇}`
  },

  // ── Math ───────────────────────────────────────────────────────────────────

  mathInvalid:
    `${casualPrefix}🧮 {Não {reconheci|entendi} essa {expressão|fórmula}{|.| aí{ não{|!| ein?}}}|Não entendi o que{|vc|você|ocê} quis dizer{|.| aí{ não{|!| ein?}}}|{Tendi|Entendi} foi nada${sentenceEnd}\n} {Tenta um desses:|Exemplos que funcionam:|Algo{|tipo} assim funciona:}\n\n` +
    '• `1 + 2 * 3`\n' +
    '• `(4 + 6) / 2`\n' +
    '• `2 ^ 3`\n' +
    '• `40% de 250` · `raiz cúbica de 27` · `6³`',

  mathCheckedResult(explanation: string): string {
    return `🧮 {Conferi duas vezes pra ter certeza|Fiz com calma, pode confiar... 😌|Calculei, recalculei, e:|Precisei usar a calculadora kk}\n\n${explanation}`
  },

  mathResult(explanation: string): string {
    return `{🧮|📐|🔢} {Saiu:|Resultado:|Aqui ó:|A resposta é:|Deu:} ${explanation}{| 😌| — de nada 🙃}`
  }
}