const TEXAS_API_BASE_URL = 'https://api.texaswho.net.br'
const TEXAS_API_KEY = 'nfdhgnr8f'

type TexasApiResponse = {
  status?: number
  message?: string
  result?: string
}

export function buildTexasApiUrl(endpoint: string, params: Record<string, string>): string {
  const url = new URL(`${TEXAS_API_BASE_URL}/${endpoint}`)
  url.searchParams.set('apikey', TEXAS_API_KEY)
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
