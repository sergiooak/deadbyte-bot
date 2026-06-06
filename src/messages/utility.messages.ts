const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

export const utilityMessages = {
  dddResult(ddd: string, stateName: string, state: string, cityCount: number, cityList: string): string {
    return `{📍|☎️|📞} *{DDD|Código|Discagem Direta a Distância} ${ddd}* — ${stateName} (${state})\n\n{🏙️|🌆|🌃} *{Cidades|Municípios|Localidades|Regiões} ({${cityCount}|total de ${cityCount}|${cityCount} no total}):* ${cityList}`
  },
  dddMissingInput:
    '{Manda|Informa|Joga aí|Solta} um DDD, responda {a mensagem de }alguém ou marque a pessoa. {Ex:|Exemplo, já que aparentemente precisa:|Tipo assim:} *!ddd 34*',
  dddInternational(label: string, ddi: string): string {
    return `*${label}*: {{isso aí tem cara de número gringo|esse número veio de fora com mala despachada|isso aí está com sotaque internacional}, meu {consagrado|nobre|chapa}. DDD é coisa {de BR|do Brasil}, então usa *!ddi +${ddi}* e {para de nacionalizar número na marra|aceita que o mundo é maior que o +55|vamos cada comando no seu quadrado}.}`
  },
  dddInvalid(label: string): string {
    return `*${label}*: {me dá um DDD válido com 2 dígitos|DDD tem 2 dígitos, tecnologia antiga porém funcional|manda um DDD com 2 dígitos e poupa nós dois}. Ex: *!ddd 34*`
  },
  dddNotFound(label: string, ddd: string): string {
    return `*${label}*: {DDD *${ddd}* não foi encontrado|Procurei o DDD *${ddd}* e nada|Esse DDD *${ddd}* não consta no mapa civilizado da telefonia}. {Ou é inválido|Ou a telefonia brasileira inventou DLC e não me avisou|Ou o teclado fez arte de novo}.`
  },
  ddiMissingInput:
    '{Manda|Informa|Joga aí|Solta} um DDI, responda {a mensagem de alguém|alguém} ou marque {a pessoa|o gringo}. {Ex:|Exemplo, já que aparentemente precisa:|Tipo assim:} *!ddi 52*',
  ddiSingleResult(ddi: string, country: string): string {
    return `{🌍|☎️|🌐} *{DDI|Código|Discagem} +${ddi}* {—|➜|-} ${country}`
  },
  ddiSharedResult(ddi: string, countryCount: number, countryList: string): string {
    return `{🌍|☎️|🌐} *{DDI|Código|Discagem} +${ddi}* {é compartilhado por|pertence a|está associado a} ${countryCount} {países/territórios|lugares|regiões}:\n\n${countryList}`
  },
  ddiNotFound(ddi: string): string {
    return `{DDI *+${ddi}* não foi encontrado na base|Procurei o DDI *+${ddi}* e nada|Esse DDI *+${ddi}* não apareceu no radar internacional}. {Ou é inválido|Ou o mapa tirou folga|Ou a geografia resolveu complicar}.`
  },
  ddiBrazilian(label: string, ddd?: string): string {
    return `*${label}*: {{isso é número BR|esse número aí é brasileiro com firma reconhecida|isso aí tem CPF telefônico}, meu {nobre|chapa|consagrado}. O DDI dele é +55 e o que você quer de verdade é *!ddd ${ddd ?? 'XX'}*. {Usa o comando certo|Cada comando no seu quadrado|A burocracia agradece}.}`
  },
  ddiLocalWithoutCountry(label: string): string {
    return `*${label}*: {número sem DDI não dá para adivinhar país, campeão|sem DDI na frente eu não tenho bola de cristal, chefe|número sem DDI é pedir adivinhação em horário comercial}. {Manda com + na frente, tipo *!ddi +351...*|Coloca um + na frente, tipo *!ddi +351...*}.`
  },
  ddiInvalid(label: string): string {
    return `*${label}*: {me entrega um DDI válido de 1 a 4 dígitos|manda um DDI com 1 a 4 dígitos|preciso de um DDI minimamente real}. {Do jeito que veio, até a antena pediu demissão|Assim não rola, o mapa fica ofendido}.`
  },
  mathInvalid:
    `${errorPrefix}{Não {reconheci|entendi} essa {expressão|formula}{|.| aí{ não{|!| ein?}}}|Não entendi o que{|vc|você|ocê} quis dizer{|.| aí{ não{|!| ein?}}}|{Tendi|Entendi} foi nada{.|!| kk}\n} {Tenta um desses:|Exemplos que funcionam:|Tenta algo{|tipo:} assim:}\n\n` +
    '• `1 + 2 * 3`\n' +
    '• `(4 + 6) / 2`\n' +
    '• `2 ^ 3`\n' +
    '• `40% de 250` · `raiz cúbica de 27` · `6³`',
  mathCheckedResult(explanation: string): string {
    return `{Conferi duas vezes pra ter certeza:|Fiz com calma, pode confiar...|Calculei, recalculei, e:|Precisei usar a calculadora kk}\n\n${explanation}`
  },
  mathResult(explanation: string): string {
    return `{🧮|📐|🔢} {Saiu:|Resultado:|Aqui:|A reposta é:|O resultado é:|Deu:} ${explanation}`
  }
}
