import { createDeadByteId } from '@deadbyte/runtime'

export function createRuntimeEventId(): string {
  return createDeadByteId('evt')
}
