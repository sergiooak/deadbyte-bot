import type { DeadByteRuntimeEvent } from '@deadbyte/runtime'

export const DEADBYTE_EVENT_PREFIX = '__DEADBYTE_EVENT__'

export function reportEventToStdout(event: DeadByteRuntimeEvent): void {
  process.stdout.write(`${DEADBYTE_EVENT_PREFIX}${JSON.stringify(event)}\n`)
}
