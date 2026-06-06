// 
// ===== Contants =====================================================================================================
// 

const casualPrefix =
  '{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{| kk}{||!|}\n\n}'

const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

const sentenceEnd =
  '{|.|!|!!|!!!| uai| kk}'

const respondOrMarkSticker =
  '{{Vc|Você|Ocê} tem que {responde|responder|marcar|marca}|{Responda|Responde|Marca} } {a|uma|a uma}{ | mensagem {que tenha|com uma|da}} figurinha{| aí}'

const tryAgain =
  '{{Tenta|Tente} de novo|{Tenta mandar|Manda} de novo{| daqui a pouco}|{Tenta|Manda} {outra mídia|outro arquivo}}'

const optionalSuffixJoke =
  '{|\n\n{Pq {se não|senão} eu {não vou conseguir|vou ter que} {tirar do {cu|rabo} oq vc quer{|!| criar| fazer}{|!| kk| uai}|fazer {nada|porra nenhuma}{|!|, né?| uai| kk}}|Pq eu não tenho bola de cristal{!| kk| porra!}|{Senão|Se não} eu não consigo fazer porra nenhuma{|, né?| uai| kk|!|!!!}}}'

// 
// ===== Main export ==================================================================================================
// 

export const stickerMessages = {
  mediaDownloadFailed:
    `{Putz|Vixe|Eita porra}, {deu ruim ao|não rolou de|deu certo não,|deu {merda|xablau} ao}{| tentar} {baixar {essa mídia|esse arquivo}|fazer download {dessa mídia|desse arquivo}}. ${tryAgain}{|que eu finjo que foi {culpa da|a} {internet|net}{| kk}|ou tenta com {outro arquivo|outra mídia}{| uai| kk}}{|...|!| 🫠| 😁| 😇}`,

  missingCreationMedia:
    `${casualPrefix}{Manda|Envia|Me manda|Me envia} uma {foto|imagem}, vídeo, gif ou {sticker|figurinha}{| aí}, ou {respond{a|e} |marca }{|{a|uma} mensagem {com |que seja }}{{alguma|uma} mídia|{algum|um} arquivo} {pra|para} eu {transformar em|criar uma} figurinha{.|!}${optionalSuffixJoke}`,

  creationFailed:
    `${errorPrefix}{Não consegui|Deu ruim{| ao}{| tentar}|Falhei{| bonito| miseravelmente}{| tentando}} criar a figurinha{.|!|!!|!!!}\n{Tenta de novo|Tente novamente|Joga outra aí|Manda {novamente|de novo}}, vai que{| agora} {{|o {bagulho|esse trem}} resolve funcionar|dá certo?}{| kk| uai| né?}`,

  stealMissingMedia:
    `${casualPrefix}${respondOrMarkSticker} {pra eu {|conseguir }{trocar o autor/pacote|roubar|trocar os metadados|roubar {pra vc|ela}}{.|!}}${optionalSuffixJoke}`,

  toMediaMissing:
    `${casualPrefix}${respondOrMarkSticker} {pra|para} eu {|conseguir }converter em {{imagem|foto} ou vídeo|arquivo}{.|!}${optionalSuffixJoke}`,

  toMediaInvalid(mimeType: string): string {
    return `${casualPrefix}{Isso aí não é|Esse trem|Essa mensagem|Olha, isso não parece} uma figurinha não.\n{Tipo detectado|O mimetype disso aí é}: *${mimeType}*. {Preciso de WebP de verdade{| meu consagrado| manin| caralho}|Me ajuda a te ajudar|Me manda uma figurinha de verdade{|, faz favor}}${sentenceEnd}`
  },

  conversionFailed:
    `${errorPrefix}{Não consegui|Deu ruim ao|Falhei ao|Deu xablau tentando} {converter|criar|fazer} a figurinha. ${tryAgain}{| aí| ai}${sentenceEnd}`
}