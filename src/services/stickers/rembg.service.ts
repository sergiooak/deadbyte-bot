const REMBG_BASE_URL = 'http://localhost:7000'
const REMBG_MODEL = 'silueta'

export class RembgNotAvailableError extends Error {
  constructor() {
    super('rembg não está rodando na porta 7000')
    this.name = 'RembgNotAvailableError'
  }
}

export class RembgService {
  async removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(imageBuffer)], { type: 'image/png' }), 'image.png')
    form.append('model', REMBG_MODEL)

    let response: Response
    try {
      response = await fetch(`${REMBG_BASE_URL}/api/remove`, {
        method: 'POST',
        body: form
      })
    } catch (error: unknown) {
      const code = (error as NodeJS.ErrnoException)?.code
        ?? ((error as { cause?: NodeJS.ErrnoException })?.cause?.code)
      if (code === 'ECONNREFUSED') {
        throw new RembgNotAvailableError()
      }
      throw error
    }

    if (!response.ok) {
      throw new Error(`rembg API retornou status ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}
