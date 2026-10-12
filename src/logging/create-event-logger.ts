import type { DeadByteEventLogger, DeadByteRuntimeEvent, ResolvedDeadByteConfig } from '@deadbyte/runtime'
import { RuntimeEventSchema } from '@deadbyte/runtime'
import { createConsoleLogger } from './create-console-logger.js'
import { reportEventToStdout } from './stdout-event-reporter.js'
import { log } from './evlog.js'
import { currentTrace, currentTraceState } from './trace.js'

export function createEventLogger(config: ResolvedDeadByteConfig): DeadByteEventLogger {
  const consoleLogger = createConsoleLogger()

  return {
    async emit(event) {
      const trace = currentTrace()
      const parsed = RuntimeEventSchema.parse(trace ? { ...event, payload: { ...event.payload, trace: { ...trace } } } : event)
      if (config.mode === 'managed' || config.logging.eventsToStdout) {
        reportEventToStdout(parsed)
      } else {
        const line = parsed.message ? `${parsed.name}: ${parsed.message}` : parsed.name
        consoleLogger[parsed.level === 'fatal' ? 'error' : parsed.level](line, parsed.payload ?? '')
      }

      recordInWideEvents(parsed)
    }
  }
}

// Eventos que só repetem o que o wide event da mensagem já resume.
const NOISY_EVENTS = new Set(['message.received', 'message.ignored', 'whatsapp.qr.generated'])

/**
 * Dentro de uma mensagem: o evento vira um passo do wide event (e erros vão para log.error).
 * Fora de uma mensagem (ciclo de vida do WhatsApp/runtime): vira um evento evlog próprio.
 */
function recordInWideEvents(event: DeadByteRuntimeEvent): void {
  const state = currentTraceState()
  if (state?.wide) {
    state.steps.push(event.name)
    const { trace: _trace, ...details } = (event.payload ?? {}) as Record<string, unknown>
    if (Object.keys(details).length) state.wide.set({ details: { [event.name]: details } })
    // command.error já foi registrado com why/fix por reportCommandError.
    if (event.error && event.name !== 'command.error') {
      const error = Object.assign(new Error(event.error.message), { name: event.error.name ?? 'Error', stack: event.error.stack })
      state.wide.error(error, { step: event.name })
    }
    return
  }

  if (NOISY_EVENTS.has(event.name)) return
  const { qr: _qr, ...payload } = (event.payload ?? {}) as Record<string, unknown>
  const fields = { event: event.name, instanceId: event.instanceId, ...payload, ...(event.error ? { error: event.error } : {}) }
  if (event.level === 'error' || event.level === 'fatal') log.error(fields)
  else if (event.level === 'warn') log.warn(fields)
  else log.info(fields)
}
