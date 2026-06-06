export const stickerMessages = {
  mediaDownloadFailed:
    '{{Putz|Vixe|Eita}, deu ruim|Deu certo não|Não rolou} de baixar essa mídia. {Tenta mandar de novo daqui a pouco|{Manda|Envia|Tenta} aí {novamente|de novo} que eu finjo que foi {culpa da|a} internet{| kk}|{Manda|Tenta} de novo, vai que dessa vez da certo{| uai| kk}}.',

  missingCreationMedia:
    '{Manda|Envia|Me manda|Me envia} uma {foto|imagem}, vídeo, gif ou {sticker|figurinha}{| aí}, ou {respond{a|e} |marca }{|{a|uma} mensagem {com |que seja }}{{alguma|uma} mídia|{algum|um} arquivo} {pra|para} eu {transformar em|criar uma} figurinha{.|!} {|Pq se não eu não vou conseguir {tirar do {cu|rabo} oq vc quer{|!| criar| fazer}{|!| kk| uai}|fazer nada{|!| né?| uai| kk}}|Pq eu não tenho bola de cristal{!| kk|porra!}}',

  creationFailed:
    '{|{Eita|Vixe|Vish|Uai}{!|!!|!!!} }{Não consegui|Deu ruim|Falhei bonito} {ao|de}{| tentar} criar a figurinha{.|!|!!|!!!}\n{Tenta de novo|Tente novamente|Joga outra aí|Manda {novamente|de novo}}, vai que{| agora} {{|o {bagulho|esse trem}} resolve funcionar|da certo?}{| kk| uai| né?}',

  stealMissingMedia:
    '{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{|.|!| kk} }{{Vc|Você|Ocê} tem que {responde|reponder|macar|marca}|{Responda|Responde|Marca}} {a|uma|a uma}{ | mensagem {que tenha|com uma|da}} figurinha{| aí} pra eu {trocar o autor/pacote|roubar|trocar os metadados|roubar pra vc}{|.|!|}{| uai| kk}',

  toMediaMissing:
    '{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{| kk}{|.|!|} }{{Vc|Você|Ocê} tem que {responde|reponder|macar|marca}|{Responda|Responde|Marca}} {a|uma|a uma}{ | mensagem {que tenha|com uma|da}} figurinha{| aí} {pra|para} eu {|conseguir }converter em {{imagem|foto} ou vídeo|arquivo}{.|!|!!!}{| Senão {vc|você|ocê} me complica| Ai fica dificil| Fica dificil assim}{| kk| uai}',

  toMediaInvalid(mimeType: string): string {
    return `{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{| kk}{|.|!|} }{Isso aí não é|Esse trem|Essa mensagem|Olha, isso não parece} uma figurinha não.\n{Tipo detectado|O mimetype disso ai é}: *${mimeType}*. {Preciso de WebP de verdade{| meu consagrado| manin| caralho}|Me ajuda a te ajudar|Me manda uma figurinha de verdade{|, faz favor}}{|.|!|!!|!!!| uai| kk}`
  },

  conversionFailed:
    '{|{Opa|Oops|Eita}{!} }{Não consegui|Deu ruim ao|Falhei ao|Deu xablau tentando} {converter|criar|fazer} a figurinha. {{Tenta|Manda} {outra mídia|outro arquivo}|{Tenta|Tente} de novo}{| aí| ai}{.|!|!!|!!!| uai| kk}'
}