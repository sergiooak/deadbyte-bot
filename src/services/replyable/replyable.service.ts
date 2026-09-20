import type { CommandContext } from '@deadbyte/runtime'

/**
 * Handler chamado quando o usuario responde a uma mensagem "respondivel".
 * Recebe o contexto da resposta, o payload guardado no momento do registro
 * e o texto da resposta do usuario (ja sem espacos nas pontas).
 */
export type ReplyableHandler<P = unknown> = (
  ctx: CommandContext,
  payload: P,
  replyText: string
) => Promise<void>

type ReplyableEntry = {
  type: string
  payload: unknown
  chatId: string
  expiresAt: number
}

const DEFAULT_TTL_MS = 10 * 60 * 1000 // 10 minutos

/**
 * Gerencia mensagens "respondiveis": mensagens enviadas pelo bot que aguardam
 * uma resposta do usuario. Ao enviar, registra-se o ID da mensagem junto de um
 * `type` e um `payload`. Quando alguem responde essa mensagem, o dispatcher
 * encontra o registro pelo ID da mensagem citada e invoca o handler do `type`.
 *
 * Reutilizavel para qualquer fluxo de pergunta/resposta (ex: escolher fornecedor
 * de emoji, escolher baixar video/audio de um link, etc).
 */
export class ReplyableService {
  private readonly entries = new Map<string, ReplyableEntry>()
  private readonly handlers = new Map<string, ReplyableHandler>()
  private readonly ttlMs: number

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs
  }

  /** Registra o handler que trata respostas de um determinado `type`. */
  registerHandler<P>(type: string, handler: ReplyableHandler<P>): void {
    this.handlers.set(type, handler as ReplyableHandler)
  }

  /** Marca uma mensagem enviada como respondivel, guardando seu contexto. */
  register(messageId: string, type: string, payload: unknown, chatId: string): void {
    this.prune()
    this.entries.set(messageId, {
      type,
      payload,
      chatId,
      expiresAt: Date.now() + this.ttlMs
    })
  }

  /** Retorna o registro de uma mensagem respondivel (ou undefined se ausente/expirado). */
  get(messageId: string | undefined): ReplyableEntry | undefined {
    if (!messageId) return undefined
    const entry = this.entries.get(messageId)
    if (!entry) return undefined
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(messageId)
      return undefined
    }
    return entry
  }

  getHandler(type: string): ReplyableHandler | undefined {
    return this.handlers.get(type)
  }

  /** Remove o registro (use quando o fluxo terminou e nao aceita mais respostas). */
  consume(messageId: string): void {
    this.entries.delete(messageId)
  }

  private prune(): void {
    const now = Date.now()
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(id)
    }
  }
}
