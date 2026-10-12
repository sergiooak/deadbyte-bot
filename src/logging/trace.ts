import { AsyncLocalStorage } from 'node:async_hooks'
import type { RequestLogger } from 'evlog'

/**
 * Rastro de uma mensagem: todo evento emitido enquanto ela é processada (comando, render de
 * figurinha, erro) carrega o mesmo traceId, para o painel agrupar a ação num item só.
 * Não guarda o texto da mensagem nem o número completo (LGPD: minimização).
 */
export type MessageTrace = {
  traceId: string
  chat: { name?: string; type: 'group' | 'private' }
  sender: { name?: string; number?: string }
  command?: { id: string; alias?: string; group?: string }
  messageType?: string
}

type TraceState = MessageTrace & {
  /** Wide event do evlog desta mensagem. */
  wide?: RequestLogger
  /** Nomes dos eventos emitidos durante a mensagem, em ordem. */
  steps: string[]
}

const storage = new AsyncLocalStorage<TraceState>()

export function runWithTrace<T>(trace: MessageTrace, wide: RequestLogger | undefined, task: () => Promise<T>): Promise<T> {
  return storage.run({ ...trace, wide, steps: [] }, task)
}

/** Rastro para anexar aos eventos: sem o logger e sem os passos. */
export function currentTrace(): MessageTrace | undefined {
  const state = storage.getStore()
  if (!state) return undefined
  const { wide: _wide, steps: _steps, ...trace } = state
  return trace
}

export function currentTraceState(): TraceState | undefined {
  return storage.getStore()
}

export function setTraceCommand(command: MessageTrace['command']): void {
  const trace = storage.getStore()
  if (trace) {
    trace.command = command
  }
}

type ErrorReporter = (error: unknown) => void
let reporter: ErrorReporter | undefined

export function setCommandErrorReporter(next: ErrorReporter): void {
  reporter = next
}

/**
 * Para erros que o comando trata sozinho (responde "deu ruim" no chat). Sem isso o erro some:
 * o comando termina com sucesso e o painel não mostra o motivo.
 */
export function reportCommandError(error: unknown): void {
  storage.getStore()?.wide?.error(error instanceof Error ? error : String(error), { step: 'command' })
  reporter?.(error)
}
