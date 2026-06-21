const TEXAS_API_BASE_URL = 'https://api.texaswho.net.br'

type TexasApiResponse = {
  status?: number
  message?: string
  result?: string
}

export type BibleVerseResult = {
  status: boolean
  nome: string
  capitulo: string | number
  versiculo?: string | number
  escrita: string
}

export type BibleChapterResult = {
  status: boolean
  nome: string
  capitulo: string | number
  escrita: string | string[]
}

export type BibleSearchResult = {
  livro: string
  capitulo: number
  versiculo: number
}

type BibleApiResponse = {
  status: number
  message: string
  result: BibleVerseResult | BibleChapterResult | BibleSearchResult[]
}

export function buildTexasApiUrl(endpoint: string, params: Record<string, string>): string {
  const apiKey = process.env.DEADBYTE_TEXAS_API_KEY?.trim()
  if (!apiKey) throw new Error('DEADBYTE_TEXAS_API_KEY is required to call Texas API.')

  const url = new URL(`${TEXAS_API_BASE_URL}/${endpoint}`)
  url.searchParams.set('apikey', apiKey)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

function extractResultUrl(result: string | undefined): string {
  if (!result) throw new Error('Texas API response does not include a result URL.')
  const markdownLink = /^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/.exec(result)
  return markdownLink?.[1] ?? result
}

function resolveImageMimeType(headers: Headers): string {
  const contentType = headers.get('content-type')?.split(';')[0]?.trim()
  if (contentType?.startsWith('image/')) return contentType
  return 'image/webp'
}

async function fetchTexasImage(endpoint: string, params: Record<string, string>): Promise<{ buffer: Buffer; mimeType: string }> {
  const commandUrl = buildTexasApiUrl(endpoint, params)
  const commandResponse = await fetch(commandUrl)
  if (!commandResponse.ok) throw new Error(`Texas API error: ${commandResponse.status} ${commandResponse.statusText}`)

  const payload = await commandResponse.json() as TexasApiResponse
  if (payload.status && payload.status !== 200) throw new Error(payload.message ?? `Texas API status: ${payload.status}`)

  const imageUrl = extractResultUrl(payload.result)
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) throw new Error(`Texas image download error: ${imageResponse.status} ${imageResponse.statusText}`)

  const arrayBuffer = await imageResponse.arrayBuffer()
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: resolveImageMimeType(imageResponse.headers)
  }
}

export function fetchTexasAttp(text: string): Promise<{ buffer: Buffer; mimeType: string }> {
  return fetchTexasImage('attp', {
    name: '1',
    txt: text
  })
}

async function fetchBiblia(params: Record<string, string>): Promise<BibleApiResponse['result']> {
  const apiKey = process.env.DEADBYTE_TEXAS_API_KEY?.trim()
  if (!apiKey) throw new Error('DEADBYTE_TEXAS_API_KEY is required to call Texas API.')

  const url = new URL(`${TEXAS_API_BASE_URL}/biblia`)
  url.searchParams.set('apikey', apiKey)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error(`Texas API error: ${response.status} ${response.statusText}`)

  const payload = await response.json() as BibleApiResponse
  if (payload.status !== 200) throw new Error(payload.message ?? `Texas API status: ${payload.status}`)

  return payload.result
}

export function fetchBibleRandomVerse(): Promise<BibleVerseResult> {
  return fetchBiblia({ type: 'randomversiculo' }) as Promise<BibleVerseResult>
}

export function fetchBibleRandomChapter(): Promise<BibleChapterResult> {
  return fetchBiblia({ type: 'randomcapitulo' }) as Promise<BibleChapterResult>
}

export function fetchBibleChapter(livro: string, capitulo: string): Promise<BibleChapterResult> {
  return fetchBiblia({ type: 'getcapitulo', livro, capitulo }) as Promise<BibleChapterResult>
}

export function fetchBibleVerse(livro: string, versiculo: string): Promise<BibleVerseResult> {
  return fetchBiblia({ type: 'getversiculo', livro, versiculo }) as Promise<BibleVerseResult>
}

export function fetchBibleSearchWord(palavra: string): Promise<BibleVerseResult> {
  return fetchBiblia({ type: 'pesquisarpalavra', palavra }) as Promise<BibleVerseResult>
}

export function fetchBibleSearchWordAll(palavra: string): Promise<BibleSearchResult[]> {
  return fetchBiblia({ type: 'pesquisarpalavraarray', palavra }) as Promise<BibleSearchResult[]>
}
