import { FfmpegService } from '../media/ffmpeg.service.js'

// API key hardcoded - sera recriada com novas chaves no futuro
const TTP_API_KEY = 'DEAD'
const TTP_BASE_URL = 'https://v1.deadbyte.com.br'

function buildTtpUrl(text: string, style: 1 | 2 | 3 = 1, subtitle = false): string {
  const url = new URL(`${TTP_BASE_URL}/image-creator/ttp/${style}`)
  url.searchParams.set('key', TTP_API_KEY)
  url.searchParams.set('message', text)
  if (subtitle) url.searchParams.set('subtitle', 'true')
  return url.toString()
}

/**
 * Detecta o mime type real a partir dos magic bytes do buffer.
 * O endpoint TTP retorna imagem com Content-Type incorreto (text/plain),
 * entao precisamos detectar manualmente -- igual ao unsafeMime do v3.
 */
function detectMimeType(buf: Buffer): string {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif'
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp'
  return 'image/png' // fallback seguro para o sticker service converter
}

/**
 * Baixa a imagem TTP da API e retorna buffer + mime type real.
 * Equivalente ao MessageMedia.fromUrl(url, { unsafeMime: true }) do v3.
 */
export async function fetchTtp(text: string, style: 1 | 2 | 3 = 1): Promise<{ buffer: Buffer; mimeType: string }> {
  const url = buildTtpUrl(text, style)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TTP API error: ${res.status} ${res.statusText}`)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const mimeType = detectMimeType(buffer)
  return { buffer, mimeType }
}

/**
 * Sobrepoe um subtitulo (legenda) na parte inferior de um sticker WebP 512x512.
 *
 * Busca a imagem de legenda da API TTP (subtitle=true) e usa ffmpeg para
 * escala-la para 512px de largura antes de compor no rodape do sticker.
 * Isso garante proporcao correta para qualquer formato de imagem original
 * (horizontal, vertical ou quadrada), ja que o sticker ja esta 512x512.
 *
 * @param text Texto da legenda
 * @param stickerBuffer Buffer WebP 512x512 ja convertido pelo StickerService
 */
export async function overlaySubtitle(text: string, stickerBuffer: Buffer): Promise<Buffer> {
  const url = buildTtpUrl(text, 1, true)
  const res = await fetch(url)
  if (!res.ok) return stickerBuffer

  const ab = await res.arrayBuffer()
  const subBuf = Buffer.from(ab)

  const ffmpegService = new FfmpegService()
  return ffmpegService.overlaySubtitleOnSticker(stickerBuffer, subBuf)
    .catch(() => stickerBuffer)
}
