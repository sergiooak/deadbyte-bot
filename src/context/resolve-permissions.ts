import type { PermissionContext, ResolvedDeadByteConfig } from '@deadbyte/runtime'
import type { DeadByteChat, DeadByteContact } from '@deadbyte/runtime'

export function resolvePermissions(
  config: ResolvedDeadByteConfig,
  chat: DeadByteChat,
  sender: DeadByteContact
): PermissionContext {
  const candidates = new Set([sender.id, sender.number, sender.name].filter((value): value is string => Boolean(value)))
  const isOwner = config.owners.some((owner) => candidates.has(owner))

  return {
    isOwner,
    isGroup: chat.isGroup,
    senderId: sender.id,
    chatId: chat.id
  }
}
