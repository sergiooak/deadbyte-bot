const casualPrefix =
  '{|{Po|Poxa|Porra|Se liga|Uai} {vei|mano|bro|brother|bixo|bicho}{| kk}{||!|}\n\n}'

const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

const sentenceEnd =
  '{|.|!|!!|!!!| uai| kk}'

const respondOrMarkSticker =
  '{{Vc|Voce|Oce} tem que {responde|responder|marcar|marca}|{Responda|Responde|Marca} } {a|uma|a uma}{ | mensagem {que tenha|com uma|da}} figurinha{| ai}'

const tryAgain =
  '{{Tenta|Tente} de novo|{Tenta mandar|Manda} de novo{| daqui a pouco}|{Tenta|Manda} {outra midia|outro arquivo}}'

const optionalSuffixJoke =
  '{|\n\n{Pq {se nao|senao} eu {nao vou conseguir|vou ter que} {tirar do {cu|rabo} oq vc quer{|!| criar| fazer}{|!| kk| uai}|fazer {nada|porra nenhuma}{|!|, ne?| uai| kk}}|Pq eu nao tenho bola de cristal{!| kk| porra!}|{Senao|Se nao} eu nao consigo fazer porra nenhuma{|, ne?| uai| kk|!|!!!}}}'

export const stickerMessages = {
  // Erros internos

  mediaDownloadFailed:
    `${errorPrefix}[baixar] {Deu ruim ao|Falhei ao|Nao consegui} baixar a midia. ${tryAgain}{|, que eu finjo que foi {culpa da|a} {internet|net}{| kk}|, ou tenta com {outro arquivo|outra midia}{| uai| kk}}{|...|!|}`,

  creationFailed:
    `${errorPrefix}[criar] {Nao consegui|Deu ruim{| ao}{| tentar}|Falhei{| bonito| miseravelmente}{| tentando}} criar a figurinha{.|!|!!|!!!}\n{Tenta de novo|Tente novamente|Joga outra ai|Manda {novamente|de novo}}, vai que{| agora} {{|o {bagulho|esse trem}} resolve funcionar|da certo?}{| kk| uai| ne?}`,

  conversionFailed:
    `${errorPrefix}[converter] {Nao consegui|Deu ruim ao|Falhei ao|Deu xablau tentando} {converter|criar|fazer} a figurinha. ${tryAgain}{| ai| ai}${sentenceEnd}`,

  // Erros do usuario

  missingCreationMedia:
    `${casualPrefix}[foto] {Manda|Envia|Me manda|Me envia} uma imagem/video/sticker{| ou gif}{| ai}, ou {respond{a|e} |marca }{|{a|uma} mensagem {com |que seja }}{{alguma|uma} midia|{algum|um} arquivo} {pra|para} eu {transformar em|criar uma} figurinha{.|!}${optionalSuffixJoke}`,

  stealMissingMedia:
    `${casualPrefix}[roubar] ${respondOrMarkSticker} {pra eu {|conseguir }{trocar o autor/pacote|roubar|trocar os metadados|roubar {pra vc|ela}}{.|!}}${optionalSuffixJoke}`,

  toMediaMissing:
    `${casualPrefix}[foto] ${respondOrMarkSticker} {pra|para} eu {|conseguir }converter em {{imagem|foto} ou video|arquivo}{.|!}${optionalSuffixJoke}`,

  toMediaInvalid(mimeType: string): string {
    return `${casualPrefix}[tipo] {Isso ai nao e|Esse trem|Essa mensagem|Olha, isso nao parece} uma figurinha nao.\n{Tipo detectado|O mimetype disso ai e}: *${mimeType}*. {Preciso de WebP de verdade{| meu consagrado| manin| caralho}|Me ajuda a te ajudar|Me manda uma figurinha de verdade{|, faz favor}}${sentenceEnd}`
  },

  // .bg / rembg

  bgMissingMedia:
    `${casualPrefix}[foto] {Manda|Envia|Me manda} uma foto{| ai} {pra|para} eu {remover o fundo|tirar o fundo}{.|!}${optionalSuffixJoke}`,

  bgNotAvailable:
    `${errorPrefix}[rembg] O rembg nao ta rodando na porta 7000. {Sobe o servidor|Liga o rembg}{| primeiro}{| la|, brother|, mano}{.|!} {Sem ele eu nao consigo remover o fundo|Preciso dele pra funcionar}{| kk| uai}${sentenceEnd}`,

  bgRemovalFailed:
    `${errorPrefix}[fundo] {Deu ruim|Falhei} ao remover o fundo. ${tryAgain}{| ai| ai}${sentenceEnd}`,

  bgAnimatedWarning:
    `[aviso] {Esse comando|O .bg} so {funciona|rola} com {fotos estaticas|imagens estaticas|fotos}{.|!} {Vou usar|Usando} o primeiro frame{|, ta?}`,

  bgVideoWarning:
    `[aviso] {Video detectado|Isso e um video}{.|!} {Vou usar|Usando} so o primeiro frame pra remover o fundo{.|, ok?}`,

  // sticker.ly -- busca, pacote e em alta

  lyMissingTerm:
    `${casualPrefix}[ly] {Manda|Me manda|Digita} um termo {pra|para} eu {buscar|procurar} no sticker.ly{.|!}\nEx: *!ly gato{| de oculos}*${sentenceEnd}`,

  lyNoResults(term: string): string {
    return `${errorPrefix}[ly] O sticker.ly nao {retornou|trouxe|me deu} {nenhuma figurinha|nada} {pra|para} *"${term}"*. {Tenta {outro termo|outra palavra}|Procura {outra coisa|por outra}}{| ai}${sentenceEnd}`
  },

  lyNoResultsOnPage(term: string, totalPages: number): string {
    return `${errorPrefix}[ly] {Acabaram as figurinhas|Nao tem mais figurinhas} {pra|para} *"${term}"* nessa pagina. So {existem|tem} ${totalPages} {paginas|paginas no total}{.|!}`
  },

  lyFound(term: string, count: number): string {
    return `🤖 - {Achei|Encontrei|Olha o que eu achei:} ${count} figurinha${count > 1 ? 's' : ''} {pra|para} *"${term}"* no sticker.ly{.|!} {To|Tô|Estou} {mandando|enviando}...`
  },

  lyMorePages(prefix: string, term: string): string {
    return `\n\n{Quer mais?|Tem mais!} {Manda|Envia} *${prefix}ly2 ${term}*, *${prefix}ly3 ${term}*... {pra ver|pra pegar} as proximas{.|!}`
  },

  packMissingId:
    `${casualPrefix}[pack] {Manda|Me manda} o {codigo|id} de um pacote do sticker.ly{.|!}\nEx: *!pack 2RY2AQ* {ou|tambem aceito} o link *https://sticker.ly/s/CODIGO*${sentenceEnd}`,

  packInvalidId:
    `${errorPrefix}[pack] {Isso nao parece|Esse nao e} um codigo de pacote valido{.|!} {O codigo tem|Tem que ter} 6 {letras/numeros|caracteres}, tipo *2RY2AQ*${sentenceEnd}`,

  packNotFound(packId: string): string {
    return `${errorPrefix}[pack] {Nao achei|Nao encontrei} {nenhum pacote|o pacote} *"${packId}"* no sticker.ly. {Confere|Verifica} o codigo {e tenta de novo|ai}${sentenceEnd}`
  },

  trendingNone:
    `${errorPrefix}[trend] O sticker.ly nao {me deu|retornou} {nenhuma figurinha em alta|nada em alta} agora. {Tenta de novo daqui a pouco|Tenta mais tarde}${sentenceEnd}`,

  trendingFound(count: number): string {
    return `🤖 - {Olha as figurinhas em alta|Toma ${count} figurinhas aleatorias|Separei ${count} em alta} do sticker.ly{.|!} {To|Tô|Estou} {mandando|enviando}...`
  },

  packFound(name: string, count: number): string {
    return `🤖 - {Achei|Encontrei|Olha o que eu achei:} o pacote *"${name}"* com ${count} figurinha${count > 1 ? 's' : ''}{.|!} {To|Tô|Estou} {mandando|enviando}...`
  },

  lyPackSendFailed:
    `${errorPrefix}[ly] {Deu ruim|Falhei|Nao consegui} {ao mandar|enviar} o pacote de figurinhas. ${tryAgain}{| ai}${sentenceEnd}`,
}
