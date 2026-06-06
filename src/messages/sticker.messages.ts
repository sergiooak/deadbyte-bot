export const stickerMessages = {
  mediaDownloadFailed:
    '{Ih, falhei|Deu ruim aqui|Não consegui} ao baixar a mídia. {Tenta de novo daqui a pouco|Manda de novo, só pra eu fingir que foi culpa da internet|Tenta novamente, porque aparentemente a mídia decidiu sumir}.',
  missingCreationMedia:
    '{Manda|Envia|Joga aqui} uma imagem/vídeo/sticker ou {responde|marca} uma mídia para eu virar figurinha, {porque adivinhar arquivo ainda não veio no plano|já que telepatia de mídia está fora do ar|senão eu fico só olhando pro nada}{.|!}',
  creationFailed:
    '{Não consegui|Falhei bonito|Deu ruim} ao criar a figurinha. {Tenta de novo|Pode tentar outra vez|Manda novamente, vai que agora o universo coopera}.',
  stealMissingMedia:
    '{Responde|Marca} {um sticker|uma figurinha} ou {uma mídia|alguma mídia} para eu {renomear|trocar os metadados|mexer no pacote/autor}, {porque roubar vento ainda é difícil|já que sticker imaginário não tem metadata}.',
  toMediaMissing:
    '{Responde|Marca} uma figurinha para eu {converter|transformar} em imagem ou vídeo, {porque arquivo fantasma eu ainda não exporto|senão eu vou converter exatamente nada}.',
  toMediaInvalid(mimeType: string): string {
    return `{Isso aí não parece|Essa mídia não é|Olhei aqui e isso não virou} uma figurinha. Tipo recebido: *${mimeType}*. {WebP, meu nobre|Preciso de sticker de verdade|Ajuda o bot a te ajudar}.`
  },
  conversionFailed:
    '{Não consegui|Falhei} ao converter a figurinha. {Tenta de novo|Pode tentar outra vez|Manda novamente, porque hoje o WebP acordou dramático}.'
}
