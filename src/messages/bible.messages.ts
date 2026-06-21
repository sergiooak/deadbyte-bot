const errorPrefix = '{|{Opa|Oops|Eita|Putz|Vixe|Vish}{!|!!|!!!} }'

export const bibleMessages = {
  randomVerse(nome: string, capitulo: string | number, versiculo: string | number, escrita: string): string {
    return `📖 *${nome} ${capitulo}:${versiculo}*\n\n_${escrita}_`
  },

  randomChapter(nome: string, capitulo: string | number, escrita: string): string {
    return `📖 *${nome} — Capítulo ${capitulo}*\n\n${escrita}`
  },

  chapter(nome: string, capitulo: string | number, escrita: string): string {
    return `📖 *${nome} — Capítulo ${capitulo}*\n\n${escrita}`
  },

  verse(nome: string, capitulo: string | number, versiculo: string | number, escrita: string): string {
    return `📖 *${nome} ${capitulo}:${versiculo}*\n\n_${escrita}_`
  },

  searchResult(nome: string, capitulo: string | number, versiculo: string | number, escrita: string): string {
    return `📖 *${nome} ${capitulo}:${versiculo}*\n\n_${escrita}_`
  },

  searchAllResults(palavra: string, results: { livro: string; capitulo: number; versiculo: number }[]): string {
    const count = results.length
    const preview = results
      .slice(0, 10)
      .map(r => `• ${r.livro} ${r.capitulo}:${r.versiculo}`)
      .join('\n')
    const suffix = count > 10 ? `\n\n_...e mais ${count - 10} resultado(s)._` : ''
    return `🔍 *"${palavra}"* — ${count} resultado(s) na Bíblia:\n\n${preview}${suffix}`
  },

  usageVerse: `{Ei|Opa|Hmm}, preciso do livro e versículo.\nEx: *!versiculo Salmos 23:1*`,
  usageChapter: `{Ei|Opa|Hmm}, preciso do livro e capítulo.\nEx: *!capitulo Salmos 23*`,
  usageSearch: `{Ei|Opa|Hmm}, manda a palavra pra buscar.\nEx: *!buscarbiblia amor*`,

  fetchError: `${errorPrefix}📖 {Não consegui|Deu ruim ao} buscar na Bíblia. {Tenta novamente 🙏|Algo deu errado 😔}`,
}
