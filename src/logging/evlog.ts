import { createRequestLogger, initLogger, log, type DrainContext, type RequestLogger } from 'evlog'
import { createFsDrain } from 'evlog/fs'
import { createDrainPipeline } from 'evlog/pipeline'
import type { ResolvedDeadByteConfig } from '@deadbyte/runtime'

/**
 * Logs estruturados do bot com evlog: um "wide event" por mensagem (com chat, pessoa, comando,
 * passos, duração e erro) e eventos de ciclo de vida do WhatsApp.
 *
 * - Em modo managed, o spawner define DEADBYTE_EVLOG_DIR e os eventos vão para NDJSON diário
 *   (/data/logs/bots/<instância>/AAAA-MM-DD.jsonl). O console fica em silêncio para não misturar
 *   com o protocolo __DEADBYTE_EVENT__ do stdout.
 * - Em standalone, sai no console em formato legível.
 * - Nomes e números aparecem completos. E-mails, tokens e cartões são mascarados pelo redact do evlog.
 */

let drain: (((ctx: DrainContext) => void) & { flush?: () => Promise<void> }) | undefined
let initialized = false

export function initBotLogger(config: ResolvedDeadByteConfig, version: string): void {
  if (initialized) return
  initialized = true

  const dir = process.env.DEADBYTE_EVLOG_DIR?.trim()
  const retentionDays = Number(process.env.DEADBYTE_LOG_RETENTION_DAYS ?? 180)
  if (dir) {
    const pipeline = createDrainPipeline<DrainContext>({
      batch: { size: 25, intervalMs: 2000 },
      retry: { maxAttempts: 3, backoff: 'exponential', initialDelayMs: 500 },
      onDropped: (events, error) => console.error(`[evlog] ${events.length} eventos descartados:`, error?.message)
    })
    // Um arquivo por dia: maxFiles = dias de retenção.
    drain = pipeline(createFsDrain({ dir, pretty: false, maxFiles: retentionDays > 0 ? retentionDays : undefined }))
  }

  initLogger({
    env: {
      service: 'deadbyte-bot',
      environment: process.env.NODE_ENV ?? 'development',
      version,
      commitHash: process.env.DEADBYTE_COMMIT || undefined
    },
    // Mensagem sem comando sai como debug no wide event: não é gravada.
    minLevel: 'info',
    pretty: config.mode === 'standalone',
    silent: config.mode === 'managed',
    redact: { builtins: ['email', 'creditCard', 'jwt', 'bearer', 'iban'], paths: ['payload.qr', 'qr', 'code'] },
    drain
  })
}

export async function flushBotLogs(): Promise<void> {
  await drain?.flush?.()
}

/** Wide event de uma mensagem. O chamador acumula contexto com set() e chama emit() no fim. */
export function createMessageLogger(traceId: string): RequestLogger {
  return createRequestLogger({ method: 'MESSAGE', path: 'whatsapp/message', requestId: traceId })
}

export { log }
