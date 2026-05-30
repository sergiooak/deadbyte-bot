import type { DeadByteEventLogger, DeadByteRuntimeEvent, ResolvedDeadByteConfig } from '@deadbyte/runtime'
import { RuntimeEventSchema } from '@deadbyte/runtime'
import { createConsoleLogger } from './create-console-logger.js'
import { reportEventToStdout } from './stdout-event-reporter.js'

type EvlogCandidate = {
  emit?: (event: DeadByteRuntimeEvent) => void | Promise<void>
  event?: (event: DeadByteRuntimeEvent) => void | Promise<void>
  log?: (event: DeadByteRuntimeEvent) => void | Promise<void>
}

export function createEventLogger(config: ResolvedDeadByteConfig): DeadByteEventLogger {
  const consoleLogger = createConsoleLogger()
  let evlogCandidate: EvlogCandidate | undefined

  void import('evlog')
    .then((module) => {
      evlogCandidate = module as unknown as EvlogCandidate
    })
    .catch(() => {
      evlogCandidate = undefined
    })

  return {
    async emit(event) {
      const parsed = RuntimeEventSchema.parse(event)
      if (config.mode === 'managed' || config.logging.eventsToStdout) {
        reportEventToStdout(parsed)
      } else {
        const line = parsed.message ? `${parsed.name}: ${parsed.message}` : parsed.name
        consoleLogger[parsed.level === 'fatal' ? 'error' : parsed.level](line, parsed.payload ?? '')
      }

      if (typeof evlogCandidate?.emit === 'function') await evlogCandidate.emit(parsed)
      if (typeof evlogCandidate?.event === 'function') await evlogCandidate.event(parsed)
      if (typeof evlogCandidate?.log === 'function') await evlogCandidate.log(parsed)
    }
  }
}
