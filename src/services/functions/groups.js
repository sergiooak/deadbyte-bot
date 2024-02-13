import spintax from '../../utils/spintax.js'
import { getSocket } from '../../index.js'
const socket = getSocket()
/**
 * Ban user from group
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function ban (msg) {
  const hasMentions = msg.aux.mentions.length > 0
  const hasQuotedMsg = msg.hasQuotedMsg

  if (!hasMentions && !hasQuotedMsg) {
    return await msg.reply('para usar o !ban você precisa responder a mensagem da pessoa que deseja banir ou *mensionar* o @ da pessoa que deseja banir')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !ban *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !ban *você* precisa ser admin')
  }

  let target = []
  if (hasMentions) { target.push(...msg.aux.mentions) }
  if (hasQuotedMsg) { target.push(await msg.quotedMsg.sender) }
  const admins = msg.aux.admins

  target = target.filter((t) => !admins.includes(t))
  if (target.length === 0) {
    await msg.react('🤡')
    return await msg.reply('Desculpe, mas eu não posso banir administradores')
  }

  await socket.groupParticipantsUpdate(msg.from, target, 'remove')
  await msg.react(msg.aux.db.command.emoji)
}

export async function unban (msg) {
  // TODO: Verify if can add to avoid ban
  const hasMentions = msg.aux.mentions.length > 0
  const hasQuotedMsg = msg.hasQuotedMsg

  if (!hasMentions && !hasQuotedMsg) {
    return await msg.reply('para usar o !unban você precisa responder a mensagem da pessoa que deseja banir ou *mensionar* o @ da pessoa que deseja banir')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !unban *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !unban *você* precisa ser admin')
  }

  const target = []
  if (hasMentions) { target.push(...msg.aux.mentions) }
  if (hasQuotedMsg) { target.push(await msg.quotedMsg.sender) }

  await socket.groupParticipantsUpdate(msg.from, target, 'add')
  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Promote user to admin
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function promote (msg) {
  if (!msg.aux.mentions.length === 0) {
    return await msg.reply('para usar o !promove você precisa *mensionar* o @ da pessoa que deseja promover')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !promove *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !promove *você* precisa ser admin')
  }
  await socket.groupParticipantsUpdate(msg.from, msg.aux.mentions, 'promote')
  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Demote user from admin
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function demote (msg) {
  if (msg.aux.mentions.length === 0) {
    return await msg.reply('Para usar o !demote você precisa *mensionar* o @ da pessoa que deseja rebaixar')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !demote *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !demote *você* precisa ser admin')
  }

  await socket.groupParticipantsUpdate(msg.from, msg.aux.mentions, 'demote')
  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Draw a user from group
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function giveaway (msg) {
  const hasText = !!msg.body.trim()

  let participants = await msg.aux.participants
  const botId = msg.aux.me
  participants = participants.filter((p) => p.id !== botId)

  const random = Math.floor(Math.random() * (participants.length))
  const winner = participants[random]

  let message = `{🎉|🎊|🥳|✨|🌟} - {@${winner.id.split('@')[0]} parabéns|Meus parabéns @${winner.id.split('@')[0]}}! {Você|Tu|Vc} {ganhou|venceu|acaba de ganhar} o {incrível |super |magnífico |maravilhoso |fantástico |excepcional |}{sorteio|concurso|prêmio}`
  message = hasText ? `${message} de *${msg.body.trim()}*!` : message + '!'
  await socket.sendMessage(msg.from, { text: spintax(message), mentions: [winner.id] }, { ephemeralExpiration: msg.raw.message[Object.keys(msg.raw.message)[0]].contextInfo?.expiration || undefined })

  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Draw a adm from group
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function giveawayAdminsOnly (msg) {
  const hasText = msg.body.split(' ').length > 1
  const text = hasText ? msg.body : ''

  let participants = await msg.aux.participants.filter((p) => p.admin)
  const botId = msg.aux.me
  participants = participants.filter((p) => p.id !== botId)

  const random = Math.floor(Math.random() * (participants.length))
  const winner = participants[random]

  let message = `🎉 - @${winner.id.split('@')[0]} parabéns! Você ganhou o sorteio`
  message = hasText ? `${message} *${text.trim()}*!` : message + '!'
  await socket.sendMessage(msg.from, { text: spintax(message), mentions: [winner.id] }, { ephemeralExpiration: msg.raw.message[Object.keys(msg.raw.message)[0]].contextInfo?.expiration || undefined })

  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Send the message but invisible mentioning all members of the group
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function markAllMembers (msg) {
  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !todos *você* precisa ser admin')
  }

  msg.body = msg.body.charAt(0).toUpperCase() + msg.body.slice(1)

  const participants = msg.aux.participants.map((p) => p.id)

  await socket.sendMessage(msg.from, {
    text: msg.body ? `📣 - ${msg.body}` : '📣',
    mentions: participants
  }, { ephemeralExpiration: msg.raw.message[Object.keys(msg.raw.message)[0]].contextInfo?.expiration || undefined })
  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Call group Admins
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function callAdmins (msg) {
  const admins = msg.aux.admins
  await socket.sendMessage(msg.from, {
    text: '👑 - Atenção administradores!',
    mentions: admins
  }, { ephemeralExpiration: msg.raw.message[Object.keys(msg.raw.message)[0]].contextInfo?.expiration || undefined })
  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Close group for admins only
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function closeGroup (msg) {
  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !fechar *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !fechar *você* precisa ser admin')
  }
  await socket.groupSettingUpdate(msg.from, 'announcement')
  await msg.react(msg.aux.db.command.emoji)
}

/**
 * Open group for everyone
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function openGroup (msg) {
  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !abrir *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !abrir *você* precisa ser admin')
  }

  await socket.groupSettingUpdate(msg.from, 'not_announcement')
  await msg.react(msg.aux.db.command.emoji)
}
