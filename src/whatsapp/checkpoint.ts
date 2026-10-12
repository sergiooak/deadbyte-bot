import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'pathe'

/** Última mensagem recebida que o bot processou. Salva ao lado da sessão: sobrevive a redeploys. */
export type MessageCheckpoint = {
  /** Horário da mensagem no WhatsApp, em segundos (unix). */
  lastMessageAt: number
  lastMessageId?: string
  chatName?: string
  updatedAt: string
}

const WRITE_DELAY_MS = 5000

export class CheckpointStore {
  private current: MessageCheckpoint | undefined
  private timer: NodeJS.Timeout | undefined

  constructor(private readonly file: string) {
    try {
      this.current = JSON.parse(readFileSync(file, 'utf8')) as MessageCheckpoint
    } catch {
      this.current = undefined
    }
  }

  get(): MessageCheckpoint | undefined {
    return this.current
  }

  /** Avança o ponto (nunca volta) e grava com atraso para não escrever no disco a cada mensagem. */
  record(message: { timestamp?: number; id?: { _serialized?: string } }, chatName?: string): void {
    const timestamp = message.timestamp
    if (!timestamp || (this.current && timestamp < this.current.lastMessageAt)) return
    this.current = {
      lastMessageAt: timestamp,
      lastMessageId: message.id?._serialized,
      chatName,
      updatedAt: new Date().toISOString()
    }
    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = undefined
        void this.flush().catch((error: unknown) => console.error('Falha ao salvar o checkpoint de mensagens:', error))
      }, WRITE_DELAY_MS)
      this.timer.unref?.()
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    if (!this.current) return
    await mkdir(dirname(this.file), { recursive: true })
    await writeFile(this.file, JSON.stringify(this.current, null, 2), 'utf8')
  }
}
