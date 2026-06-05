import type { CommandContext, DeadByteContact } from '@deadbyte/runtime'
import type { WhatsappMessageLike } from '../whatsapp/whatsapp-adapter.js'

export type GroupTargetSource = 'argument' | 'reply' | 'mention'

export type GroupTarget = {
  id: string
  label: string
  source: GroupTargetSource
}

type ContactResolver = () => Promise<DeadByteContact | undefined>
type MentionContactResolver = () => Promise<DeadByteContact[]>

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function normalizeParticipantId(value: string | undefined): string {
  const clean = value?.trim().replace(/[^\d@.a-z]/gi, '') ?? ''
  if (!clean) return ''
  if (clean.includes('@')) return clean

  const digits = onlyDigits(clean)
  return digits ? `${digits}@c.us` : ''
}

export function participantUser(id: string | undefined): string {
  return id?.replace(/@.+$/, '') ?? ''
}

function labelForId(id: string): string {
  const user = participantUser(id)
  return user ? `@${user}` : id
}

function targetFromId(id: string | undefined, source: GroupTargetSource): GroupTarget | undefined {
  const normalized = normalizeParticipantId(id)
  if (!normalized) return undefined

  return {
    id: normalized,
    label: labelForId(normalized),
    source
  }
}

function targetFromContact(contact: DeadByteContact, source: GroupTargetSource): GroupTarget | undefined {
  const idFromNumber = contact.number ? `${onlyDigits(contact.number)}@c.us` : ''
  const normalized = normalizeParticipantId(contact.id || idFromNumber)
  if (!normalized) return undefined

  return {
    id: normalized,
    label: contact.name ?? contact.pushname ?? labelForId(normalized),
    source
  }
}

function idsFromArgs(text: string): GroupTarget[] {
  return (text.match(/(?:\+?\d[\d().-]{6,}\d)|(?:\d{6,})/g) ?? []).flatMap((value) => {
    const target = targetFromId(value, 'argument')
    return target ? [target] : []
  })
}

function dedupeTargets(targets: GroupTarget[]): GroupTarget[] {
  const seen = new Set<string>()

  return targets.filter((target) => {
    if (seen.has(target.id)) return false
    seen.add(target.id)
    return true
  })
}

export async function collectGroupTargets(
  ctx: CommandContext,
  argsText: string,
  rawMessage?: WhatsappMessageLike
): Promise<GroupTarget[]> {
  const targets: GroupTarget[] = []
  const resolveMentionedContacts = ctx.services.resolveMentionedContacts as MentionContactResolver | undefined
  const mentionedContacts = await resolveMentionedContacts?.()

  if (mentionedContacts?.length) {
    targets.push(...mentionedContacts.flatMap((contact) => {
      const target = targetFromContact(contact, 'mention')
      return target ? [target] : []
    }))
  } else {
    targets.push(...(ctx.message.mentionedIds ?? []).flatMap((id) => {
      const target = targetFromId(id, 'mention')
      return target ? [target] : []
    }))
  }

  if (ctx.quotedMessage || rawMessage?.hasQuotedMsg) {
    const resolveTargetContact = ctx.services.resolveTargetContact as ContactResolver | undefined
    const quotedContact = await resolveTargetContact?.()
    const rawQuoted = rawMessage?.getQuotedMessage ? await rawMessage.getQuotedMessage() : undefined
    const quotedId = rawQuoted?.author ?? rawQuoted?.from ?? ctx.quotedMessage?.author ?? ctx.quotedMessage?.from
    const target = quotedContact ? targetFromContact(quotedContact, 'reply') : targetFromId(quotedId, 'reply')
    if (target) targets.push(target)
  }

  targets.push(...idsFromArgs(argsText))

  return dedupeTargets(targets)
}
