import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'

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
            '-vcodec',
            'libwebp',
            '-lossless',
            '0',
            '-q:v',
            String(options.quality),
            '-loop',
            '0',
            '-an',
            '-vsync',
            '0'
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
