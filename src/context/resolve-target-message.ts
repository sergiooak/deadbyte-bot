import type { DeadByteMessage } from '@deadbyte/runtime'
import { mapWhatsappMessage } from '../whatsapp/message.mapper.js'
import type { WhatsappMessageLike } from '../whatsapp/whatsapp-adapter.js'

export type TargetMessageResult = {
  rawQuotedMessage?: WhatsappMessageLike
  rawTargetMessage: WhatsappMessageLike
  quotedMessage?: DeadByteMessage
  targetMessage: DeadByteMessage
}

export async function resolveTargetMessage(message: WhatsappMessageLike): Promise<TargetMessageResult> {
  if (message.hasQuotedMsg && message.getQuotedMessage) {
    const quoted = await message.getQuotedMessage()
    return {
      rawQuotedMessage: quoted,
      rawTargetMessage: quoted,
      quotedMessage: mapWhatsappMessage(quoted),
      targetMessage: mapWhatsappMessage(quoted)
    }
  }

  return {
    rawTargetMessage: message,
    targetMessage: mapWhatsappMessage(message)
  }
}
