import { defineDeadByteBot } from '@deadbyte/runtime'
import { commands } from '../commands/index.js'

export const deadbyteBot = defineDeadByteBot({
  name: 'DeadByte',
  version: '4.0.0',
  commands,
  events: {
    ready: async () => undefined,
    message: async () => undefined
  }
})

export default deadbyteBot
