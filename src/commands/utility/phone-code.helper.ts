import type { CommandContext, DeadByteContact } from '@deadbyte/runtime'
import { lookupDdi } from './ddi-data.helper.js'

export type PhoneTargetSource = 'argument' | 'reply' | 'mention'

export type PhoneCodeTarget = {
  label: string
  raw: string
  digits: string
  source: PhoneTargetSource
  hasExplicitPlus: boolean
}

export type ParsedPhoneNumber =
  | {
    kind: 'brazil'
    ddi: '55'
    ddd?: string
    nationalNumber: string
  }
  | {
    kind: 'international'
    ddi: string
  }
  | {
    kind: 'local'
    ddd?: string
  }
  | {
    kind: 'empty'
  }

type ContactResolver = () => Promise<DeadByteContact | undefined>
type MentionContactResolver = () => Promise<DeadByteContact[]>

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function labelForId(id: string): string {
  const digits = onlyDigits(id)
  return digits ? `+${digits}` : id
}

function targetFromId(id: string, source: PhoneTargetSource): PhoneCodeTarget | undefined {
  const digits = onlyDigits(id)
  if (!digits) return undefined

  return {
    label: labelForId(id),
    raw: id,
    digits,
    source,
    hasExplicitPlus: false
  }
}

function targetFromContact(contact: DeadByteContact, source: PhoneTargetSource): PhoneCodeTarget | undefined {
  const idDigits = contact.id.endsWith('@c.us') ? onlyDigits(contact.id) : ''
  const numberDigits = onlyDigits(contact.number ?? '')
  const raw = numberDigits.length >= 8
    ? (contact.number ?? '')
    : idDigits.length >= 8
      ? contact.id
      : ''
  const digits = onlyDigits(raw)
  if (!digits) return undefined

  return {
    label: contact.name ?? contact.pushname ?? `+${digits}`,
    raw,
    digits,
    source,
    hasExplicitPlus: false
  }
}

function stripMentionTokens(value: string): string {
  return value
    .split(/\s+/)
    .filter((token) => !token.startsWith('@'))
    .join(' ')
    .trim()
}

export function parsePhoneNumber(target: PhoneCodeTarget): ParsedPhoneNumber {
  if (!target.digits) return { kind: 'empty' }

  if (target.hasExplicitPlus) {
    if (target.digits.startsWith('55')) {
      return {
        kind: 'brazil',
        ddi: '55',
        ddd: target.digits.slice(2, 4) || undefined,
        nationalNumber: target.digits.slice(2)
      }
    }

    return {
      kind: 'international',
      ddi: detectDdi(target.digits)
    }
  }

  if (target.source !== 'argument' && target.digits.startsWith('55')) {
    return {
      kind: 'brazil',
      ddi: '55',
      ddd: target.digits.slice(2, 4) || undefined,
      nationalNumber: target.digits.slice(2)
    }
  }

  if (target.digits.length >= 10 && target.digits.length <= 11) {
    return {
      kind: 'local',
      ddd: target.digits.slice(0, 2)
    }
  }

  if (target.digits.length > 11 && target.digits.startsWith('55')) {
    return {
      kind: 'brazil',
      ddi: '55',
      ddd: target.digits.slice(2, 4) || undefined,
      nationalNumber: target.digits.slice(2)
    }
  }

  if (target.digits.length > 11) {
    return {
      kind: 'international',
      ddi: detectDdi(target.digits)
    }
  }

  return {
    kind: 'local',
    ddd: target.digits.length >= 2 ? target.digits.slice(0, 2) : undefined
  }
}

export function createArgumentTarget(value: string): PhoneCodeTarget | undefined {
  const raw = value.trim()
  const digits = onlyDigits(raw)
  if (!digits) return undefined

  return {
    label: raw,
    raw,
    digits,
    source: 'argument',
    hasExplicitPlus: raw.startsWith('+')
  }
}

export async function collectPhoneTargets(
  ctx: CommandContext,
  argValue: string
): Promise<PhoneCodeTarget[]> {
  const targets: PhoneCodeTarget[] = []
  const mentionedIds = ctx.message.mentionedIds ?? []
  const argument = createArgumentTarget(mentionedIds.length > 0 ? stripMentionTokens(argValue) : argValue)
  if (argument) targets.push(argument)

  if (!argument && ctx.quotedMessage) {
    const resolveTargetContact = ctx.services.resolveTargetContact as ContactResolver | undefined
    const quotedContact = await resolveTargetContact?.()
    const quotedId = ctx.quotedMessage.author ?? ctx.quotedMessage.from
    const quotedTarget = quotedContact
      ? targetFromContact(quotedContact, 'reply')
      : targetFromId(quotedId, 'reply')
    if (quotedTarget) targets.push(quotedTarget)
  }

  if (mentionedIds.length > 0) {
    const resolveMentionedContacts = ctx.services.resolveMentionedContacts as MentionContactResolver | undefined
    const mentionedContacts = await resolveMentionedContacts?.()
    const mentionedTargets = mentionedContacts?.length
      ? mentionedContacts.flatMap((contact) => {
        const target = targetFromContact(contact, 'mention')
        return target ? [target] : []
      })
      : mentionedIds.flatMap((id) => {
        const target = targetFromId(id, 'mention')
        return target ? [target] : []
      })

    targets.push(...mentionedTargets)
  }

  return dedupeTargets(targets)
}

export function detectDdi(digits: string): string {
  for (let size = Math.min(4, digits.length); size >= 1; size -= 1) {
    const code = digits.slice(0, size)
    if (lookupDdi(Number(code))) return code
  }

  return digits.slice(0, 4)
}

function dedupeTargets(targets: PhoneCodeTarget[]): PhoneCodeTarget[] {
  const seen = new Set<string>()

  return targets.filter((target) => {
    const key = target.digits
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
