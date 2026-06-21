export const BIBLE_BOOKS: string[] = [
  // Antigo Testamento
  'Gênesis', 'Genesis',
  'Êxodo', 'Exodo',
  'Levítico', 'Levitico',
  'Números', 'Numeros',
  'Deuteronômio', 'Deuteronomio',
  'Josué', 'Josue',
  'Juízes', 'Juizes',
  'Rute',
  '1 Samuel', '2 Samuel',
  '1 Reis', '2 Reis',
  '1 Crônicas', '1 Cronicas', '2 Crônicas', '2 Cronicas',
  'Esdras',
  'Neemias',
  'Ester',
  'Jó', 'Jo',
  'Salmos',
  'Provérbios', 'Proverbios',
  'Eclesiastes',
  'Cânticos', 'Canticos',
  'Isaías', 'Isaias',
  'Jeremias',
  'Lamentações', 'Lamentacoes',
  'Ezequiel',
  'Daniel',
  'Oséias', 'Oseias',
  'Joel',
  'Amós', 'Amos',
  'Obadias',
  'Jonas',
  'Miquéias', 'Miqueias',
  'Naum',
  'Habacuque',
  'Sofonias',
  'Ageu',
  'Zacarias',
  'Malaquias',
  // Novo Testamento
  'Mateus',
  'Marcos',
  'Lucas',
  'João', 'Joao',
  'Atos',
  'Romanos',
  '1 Coríntios', '1 Corintios', '2 Coríntios', '2 Corintios',
  'Gálatas', 'Galatas',
  'Efésios', 'Efesios',
  'Filipenses',
  'Colossenses',
  '1 Tessalonicenses', '1 Tessalonicenses', '2 Tessalonicenses',
  '1 Timóteo', '1 Timoteo', '2 Timóteo', '2 Timoteo',
  'Tito',
  'Filemom',
  'Hebreus',
  'Tiago',
  '1 Pedro', '2 Pedro',
  '1 João', '1 Joao', '2 João', '2 Joao', '3 João', '3 Joao',
  'Judas',
  'Apocalipse',
]

const BOOKS_LOWER = new Set(BIBLE_BOOKS.map(b => b.toLowerCase()))

export type ParsedImplicitRef =
  | { kind: 'verse'; livro: string; versiculo: string }
  | { kind: 'chapter'; livro: string; capitulo: string }

// "Salmos 23:1" or "1 João 3:16"
const VERSE_REGEX = /^(\d\s+)?(.+?)\s+(\d+):(\d+)$/i
// "Salmos 23" or "1 João 3"
const CHAPTER_REGEX = /^(\d\s+)?(.+?)\s+(\d+)$/i

export function parseImplicitVerseRef(text: string): ParsedImplicitRef | null {
  const trimmed = text.trim()

  const verseMatch = VERSE_REGEX.exec(trimmed)
  if (verseMatch) {
    const livro = verseMatch[1] ? `${verseMatch[1].trim()} ${verseMatch[2].trim()}` : verseMatch[2].trim()
    if (!BOOKS_LOWER.has(livro.toLowerCase())) return null
    return { kind: 'verse', livro, versiculo: `${verseMatch[3]}:${verseMatch[4]}` }
  }

  const chapMatch = CHAPTER_REGEX.exec(trimmed)
  if (chapMatch) {
    const livro = chapMatch[1] ? `${chapMatch[1].trim()} ${chapMatch[2].trim()}` : chapMatch[2].trim()
    if (!BOOKS_LOWER.has(livro.toLowerCase())) return null
    return { kind: 'chapter', livro, capitulo: chapMatch[3] }
  }

  return null
}
