const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Porra}{!|!!|!!!} }'

const tryAgain =
  '{{Tenta|Tente} de novo|Manda {outra midia|outro arquivo}{| ai}}'

export const mediaMessages = {
  missingMedia:
    `${errorPrefix}{Manda|Responde|Marca} uma {imagem|foto|video|figurinha} {ai|pra mim} primeiro${tryAgain}{|, ne?| uai| kk}`,

  downloadFailed:
    `${errorPrefix}Nao consegui baixar a midia. ${tryAgain}{|, que eu finjo que foi culpa da internet{| kk}}`,

  processingFailed:
    `${errorPrefix}Deu ruim ao {processar|editar} a midia. ${tryAgain}{|, vai que da certo{| kk}}`,

  craqueAssetMissing:
    `${errorPrefix}O arquivo do craque do jogo nao foi encontrado. Fala pro dono do bot configurar o asset{|, ne?| uai}.`,
}
