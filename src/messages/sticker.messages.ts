export const stickerMessages = {
  mediaDownloadFailed:
    '{Putz|Vixe|Eita porra}, {deu ruim ao|não rolou de|deu certo não,|deu {merda|xablau} ao}{| tentar} {baixar {essa mídia|esse arquivo}|fazer download {dessa mídia|desse arquivo}}. {{Tenta mandar|Manda} de novo{| daqui a pouco}}{|que eu finjo que foi {culpa da|a} {internet|net}{| kk}|ou tenta com {outro arquivo|outra mídia}{| uai| kk}}{|...|!| 🫠| 😁| 😇}',

  missingCreationMedia:
    '{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{| kk}{.|!|} }{Manda|Envia|Me manda|Me envia} uma {foto|imagem}, vídeo, gif ou {sticker|figurinha}{| aí}, ou {respond{a|e} |marca }{|{a|uma} mensagem {com |que seja }}{{alguma|uma} mídia|{algum|um} arquivo} {pra|para} eu {transformar em|criar uma} figurinha{.|!}{|{ Pq {se não|senão} eu {não vou conseguir|vou ter que} {tirar do {cu|rabo} oq vc quer{|!| criar| fazer}{|!| kk| uai}|fazer {nada|porra nenhuma}{|!|, né?| uai| kk}}| Pq eu não tenho bola de cristal{!| kk| porra!}|{ Senão| Se não} eu não consigo fazer porra nenhuma{|, né?| uai| kk|!|!!!}}}',

  creationFailed:
    '{|{Eita|Vixe|Vish|Uai|Porra{| caralho}|Caralho|Putz}{!|!!|!!!} }{Não consegui|Deu ruim{| ao}{| tentar}|Falhei{| bonito| miseravelmente}{| tentando}} criar a figurinha{.|!|!!|!!!}\n{Tenta de novo|Tente novamente|Joga outra aí|Manda {novamente|de novo}}, vai que{| agora} {{|o {bagulho|esse trem}} resolve funcionar|da certo?}{| kk| uai| né?}',

  stealMissingMedia:
    '{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{|.|!| kk} }{{Vc|Você|Ocê} tem que {responde|reponder|macar|marca}|{Responda|Responde|Marca}} {a|uma|a uma}{ | mensagem {que tenha|com uma|da}} figurinha{| aí} pra eu {|conseguir }{trocar o autor/pacote|roubar|trocar os metadados|roubar {pra vc|ela}}{|.|!|}{| uai| kk}',

  toMediaMissing:
    '{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{| kk}{|.|!|} }{{Vc|Você|Ocê} tem que {responde|reponder|macar|marca}|{Responda|Responde|Marca}} {a|uma|a uma}{ | mensagem {que tenha|com uma|da}} figurinha{| aí} {pra|para} eu {|conseguir }converter em {{imagem|foto} ou vídeo|arquivo}{.|!|!!!}{| Senão {vc|você|ocê} me complica| Ai fica dificil| Fica dificil assim}{| kk| uai}',

  toMediaInvalid(mimeType: string): string {
    return `{|{Pô|Poxa|Porra|Se liga} {véi|mano|bro|brother|bixo|bicho}{| kk}{|.|!|} }{Isso aí não é|Esse trem|Essa mensagem|Olha, isso não parece} uma figurinha não.\n{Tipo detectado|O mimetype disso ai é}: *${mimeType}*. {Preciso de WebP de verdade{| meu consagrado| manin| caralho}|Me ajuda a te ajudar|Me manda uma figurinha de verdade{|, faz favor}}{|.|!|!!|!!!| uai| kk}`
  },

  conversionFailed:
    '{|{Opa|Oops|Eita|Putz}{!} }{Não consegui|Deu ruim ao|Falhei ao|Deu xablau tentando} {converter|criar|fazer} a figurinha. {{Tenta|Manda} {outra mídia|outro arquivo}|{Tenta|Tente} de novo}{| aí| ai}{.|!|!!|!!!| uai| kk}'
}