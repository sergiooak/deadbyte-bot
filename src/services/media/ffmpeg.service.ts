import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import sharp from 'sharp'

export type RenderVideoOptions = {
  size: number
  fit: 'contain' | 'cover' | 'stretch'
  fps: number
  maxSeconds: number
  quality: number
}

export class FfmpegService {
  constructor(private readonly paths: { ffmpegPath?: string; ffprobePath?: string } = {}) {
    ffmpeg.setFfmpegPath(paths.ffmpegPath || ffmpegStatic || '')
    ffmpeg.setFfprobePath(paths.ffprobePath || ffprobeStatic.path)
  }

  async probeAspectRatio(input: Buffer): Promise<{ width: number; height: number }> {
    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-probe-'))
    const inputPath = join(dir, 'input')
    await writeFile(inputPath, input)
    try {
      return await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, (err, data) => {
          if (err) return reject(err)
          const stream = data.streams.find((s) => s.codec_type === 'video')
          resolve({ width: stream?.width ?? 1, height: stream?.height ?? 1 })
        })
      })
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }

  async extractFirstFrame(input: Buffer): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-frame-'))
    const inputPath = join(dir, 'input')
    const outputPath = join(dir, 'frame.png')
    await writeFile(inputPath, input)

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions(['-frames:v', '1', '-f', 'image2'])
          .save(outputPath)
          .on('end', () => resolve())
          .on('error', (error: Error) => reject(error))
      })
      return await readFile(outputPath)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }

  async webpToMp4(input: Buffer): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-to-mp4-'))
    const gifPath = join(dir, 'input.gif')
    const outputPath = join(dir, 'output.mp4')

    try {
      const gifBuffer = await sharp(input, { animated: true }).gif().toBuffer()
      await writeFile(gifPath, gifBuffer)

      await new Promise<void>((resolve, reject) => {
        ffmpeg(gifPath)
          .outputOptions([
            '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
            '-c:v', 'libx264',
            '-movflags', '+faststart'
          ])
          .save(outputPath)
          .on('end', () => resolve())
          .on('error', (error: Error) => reject(error))
      })
      return await readFile(outputPath)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }

  /**
   * Sobrepoem uma imagem de legenda no rodape de um sticker WebP 512x512.
   *
   * A legenda e escalonada para 512px de largura via ffmpeg antes de ser
   * composited, garantindo proporcao correta independente das dimensoes
   * originais da imagem (horizontal, vertical ou quadrada).
   *
   * Funciona com WebP estatico e animado.
   */
  async overlaySubtitleOnSticker(stickerBuffer: Buffer, subtitleBuffer: Buffer): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-subtitle-'))
    const stickerPath = join(dir, 'sticker.webp')
    const subtitlePath = join(dir, 'subtitle.png')
    const outputPath = join(dir, 'output.webp')

    await writeFile(stickerPath, stickerBuffer)
    await writeFile(subtitlePath, subtitleBuffer)

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(stickerPath)
          .input(subtitlePath)
          .complexFilter([
            // Escala a legenda para 512px de largura, mantendo proporcao
            '[1:v]scale=512:-1[sub]',
            // Sobrepoem a legenda no rodape do sticker
            '[0:v][sub]overlay=0:H-h:format=auto[out]'
          ], 'out')
          .outputOptions([
            '-vcodec', 'libwebp',
            '-lossless', '0',
            '-q:v', '90',
            '-loop', '0',
            '-an',
            '-vsync', '0'
          ])
          .save(outputPath)
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
      })
      return await readFile(outputPath)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }

  async grayscale(input: Buffer, inputExt: string, outputExt: string): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-gray-'))
    const inputPath = join(dir, `input.${inputExt}`)
    const outputPath = join(dir, `output.${outputExt}`)
    await writeFile(inputPath, input)
    try {
      await new Promise<void>((resolve, reject) => {
        const filter =
          outputExt === 'mp4'
            ? 'hue=s=0,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p'
            : 'hue=s=0'
        const cmd = ffmpeg(inputPath).videoFilter(filter)
        if (outputExt === 'mp4') cmd.outputOptions(['-c:v', 'libx264', '-movflags', '+faststart'])
        if (outputExt === 'webp') cmd.outputOptions(['-vcodec', 'libwebp', '-lossless', '0', '-q:v', '90', '-loop', '0', '-an', '-vsync', '0'])
        cmd.save(outputPath)
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
      })
      return await readFile(outputPath)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }

  async overlayFull(input: Buffer, inputExt: string, outputExt: string, overlay: Buffer, opacity: number): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-overlay-'))
    const inputPath = join(dir, `input.${inputExt}`)
    const overlayPath = join(dir, 'overlay.png')
    const outputPath = join(dir, `output.${outputExt}`)
    await writeFile(inputPath, input)
    await writeFile(overlayPath, overlay)
    try {
      await new Promise<void>((resolve, reject) => {
        const finalFilter = outputExt === 'mp4'
          ? ',scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p'
          : ''
        const cmd = ffmpeg(inputPath)
          .input(overlayPath)
          .complexFilter([
            `[1:v]format=rgba,colorchannelmixer=aa=${opacity}[ov]`,
            `[0:v][ov]overlay=0:0:format=auto${finalFilter}[out]`,
          ], 'out')
        if (outputExt === 'mp4') cmd.outputOptions(['-c:v', 'libx264', '-movflags', '+faststart'])
        if (outputExt === 'webp') cmd.outputOptions(['-vcodec', 'libwebp', '-lossless', '0', '-q:v', '90', '-loop', '0', '-an', '-vsync', '0'])
        cmd.save(outputPath)
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
      })
      return await readFile(outputPath)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }

  async overlayTopRight(input: Buffer, inputExt: string, outputExt: string, overlay: Buffer): Promise<Buffer> {
    const { width, height } = await this.probeAspectRatio(input)
    // 65% do lado menor, mas nunca mais que 55% do lado maior — evita dominar em aspect ratios extremos
    const overlayW = Math.round(Math.min(Math.min(width, height) * 0.65, Math.max(width, height) * 0.55))

    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-craque-'))
    const inputPath = join(dir, `input.${inputExt}`)
    const overlayPath = join(dir, 'overlay.png')
    const outputPath = join(dir, `output.${outputExt}`)
    await writeFile(inputPath, input)
    await writeFile(overlayPath, overlay)
    try {
      await new Promise<void>((resolve, reject) => {
        const finalFilter = outputExt === 'mp4'
          ? ',scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p'
          : ''
        const cmd = ffmpeg(inputPath)
          .input(overlayPath)
          .complexFilter([
            `[1:v]scale=${overlayW}:-1,format=rgba[ov]`,
            `[0:v][ov]overlay=W-w:0:format=auto${finalFilter}[out]`,
          ], 'out')
        if (outputExt === 'mp4') cmd.outputOptions(['-c:v', 'libx264', '-movflags', '+faststart'])
        if (outputExt === 'webp') cmd.outputOptions(['-vcodec', 'libwebp', '-lossless', '0', '-q:v', '90', '-loop', '0', '-an', '-vsync', '0'])
        cmd.save(outputPath)
          .on('end', () => resolve())
          .on('error', (err: Error) => reject(err))
      })
      return await readFile(outputPath)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }

  async renderVideoToWebp(input: Buffer, options: RenderVideoOptions): Promise<Buffer> {
    const dir = await mkdtemp(join(tmpdir(), 'deadbyte-sticker-'))
    const inputPath = join(dir, 'input')
    const outputPath = join(dir, 'output.webp')
    await writeFile(inputPath, input)

    const filter =
      options.fit === 'contain'
        ? `fps=${options.fps},scale=${options.size}:${options.size}:force_original_aspect_ratio=decrease,pad=${options.size}:${options.size}:(ow-iw)/2:(oh-ih)/2:color=0x00000000,format=rgba,setsar=1`
        : options.fit === 'cover'
          ? `fps=${options.fps},scale=${options.size}:${options.size}:force_original_aspect_ratio=increase,crop=${options.size}:${options.size},format=rgba,setsar=1`
          : `fps=${options.fps},scale=${options.size}:${options.size},format=rgba,setsar=1`

    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .duration(options.maxSeconds)
          .outputOptions([
            '-vcodec', 'libwebp',
            '-lossless', '0',
            '-q:v', String(options.quality),
            '-loop', '0',
            '-an',
            '-vsync', '0'
          ])
          .videoFilters(filter)
          .save(outputPath)
          .on('end', () => resolve())
          .on('error', (error) => reject(error))
      })

      return await readFile(outputPath)
    } finally {
      await rm(dir, { force: true, recursive: true })
    }
  }
}
