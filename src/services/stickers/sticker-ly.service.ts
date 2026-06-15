import type { BufferMedia } from '../media/media.types.js'

// Wrapper publico do sticker.ly mantido pelo autor do bot.
// Docs: https://stickers-api.sergiooak.dev/getting-started
const STICKER_LY_BASE_URL = 'https://sticker-ly-api.sergiooak.com.br/api/v1'

// Acima desse score o pacote e considerado impróprio e e descartado -- igual ao v3.
const NSFW_SCORE_THRESHOLD = 69

export type StickerLyPackInfo = {
  id?: string
  name?: string
  isNsfw?: boolean
  nsfwScore?: number
}

export type StickerLySticker = {
  id: string
  url: string
  isAnimated?: boolean
  pack?: StickerLyPackInfo
}

export type StickerLyPack = {
  id: string
  name: string
  stickerUrls: string[]
}

type StickerLyEnvelope<T> = {
  status: 'success' | 'error'
  message?: string
  data: T | null
}

/**
 * Detecta o mime type real a partir dos magic bytes do buffer.
 * Os arquivos do sticker.ly vem como PNG/WebP, mas o Content-Type
 * nem sempre e confiavel -- detectamos manualmente como no `unsafeMime` do v3.
 */
function detectImageMimeType(buf: Buffer): string {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp'
  return 'image/png'
}

/** Remove stickers de pacotes marcados como NSFW. */
function isSafeSticker(sticker: StickerLySticker): boolean {
  const pack = sticker.pack
  if (!pack) return true
  if (pack.isNsfw) return false
  return (pack.nsfwScore ?? 0) <= NSFW_SCORE_THRESHOLD
}

/**
 * Cliente do wrapper publico do sticker.ly.
 *
 * Recriacao do comportamento do DeadByte v3 (`services/functions/stickers.js`):
 * busca por termo, pacote por codigo e stickers em alta (recommended).
 */
export class StickerLyService {
  constructor(private readonly baseUrl = STICKER_LY_BASE_URL) {}

  private async getJson<T>(path: string): Promise<T | null> {
    const res = await fetch(`${this.baseUrl}${path}`)
    if (!res.ok) throw new Error(`sticker.ly API error: ${res.status} ${res.statusText}`)
    const json = (await res.json()) as StickerLyEnvelope<T>
    if (json.status !== 'success') return null
    return json.data
  }

  /** Busca stickers por termo. Retorna a lista completa (NSFW filtrado) -- a paginacao e feita pelo comando. */
  async search(keyword: string): Promise<StickerLySticker[]> {
    const data = await this.getJson<StickerLySticker[]>(`/stickers/search?keyword=${encodeURIComponent(keyword)}`)
    return (data ?? []).filter(isSafeSticker)
  }

  /** Busca um pacote pelo seu codigo (ex: 2RY2AQ). */
  async getPack(packId: string): Promise<StickerLyPack | null> {
    const data = await this.getJson<StickerLyPack>(`/packs/${encodeURIComponent(packId)}`)
    if (!data || !Array.isArray(data.stickerUrls) || data.stickerUrls.length === 0) return null
    return data
  }

  /** Retorna stickers em alta (recommended), ja com NSFW filtrado. */
  async getRecommended(): Promise<StickerLySticker[]> {
    const data = await this.getJson<StickerLySticker[]>('/stickers/recommended')
    return (data ?? []).filter(isSafeSticker)
  }

  /**
   * Baixa as URLs informadas e devolve buffers prontos para virar sticker.
   * O fork do whatsapp-web.js converte cada midia para WebP e aplica o EXIF do pacote,
   * entao basta entregar a imagem original (PNG/WebP) -- igual ao `MessageMedia.fromUrl` do v3.
   * URLs que falharem ao baixar sao descartadas silenciosamente.
   */
  async downloadStickers(urls: string[]): Promise<BufferMedia[]> {
    const results = await Promise.all(
      urls.map(async (url): Promise<BufferMedia | null> => {
        try {
          const res = await fetch(url)
          if (!res.ok) return null
          const buffer = Buffer.from(await res.arrayBuffer())
          return { buffer, mimeType: detectImageMimeType(buffer), filename: 'sticker.png' }
        } catch {
          return null
        }
      })
    )
    return results.filter((media): media is BufferMedia => media !== null)
  }
}
