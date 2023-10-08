import spintax from '../../utils/spintax.js'
/**
 * Ban user from group
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function ban (msg) {
  if (!msg.hasQuotedMsg) {
    return await msg.reply('para usar o !ban você precisa responder a mensagem da pessoa que deseja banir')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !ban *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !ban *você* precisa ser admin')
  }

  const quotedMsg = await msg.getQuotedMessage()
  const author = await quotedMsg.getContact()

  await msg.aux.chat.removeParticipants([author.id._serialized])
  await msg.react('🔨')
}

/**
 * Promote user to admin
 * @param {import('whatsapp-web.js').Message} msg
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

  await msg.aux.chat.promoteParticipants(msg.aux.mentions)
  await msg.react('↗️')
}

/**
 * Demote user from admin
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function demote (msg) {
  if (!msg.aux.mentions.length === 0) {
    return await msg.reply('para usar o !demote você precisa *mensionar* o @ da pessoa que deseja rebaixar')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !demote *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !demote *você* precisa ser admin')
  }

  await msg.aux.chat.demoteParticipants(msg.aux.mentions)
  await msg.react('↘️')
}

/**
 * Draw a user from group
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function giveaway (msg) {
  const hasText = !!msg.body.trim()
  console.log('hasText', hasText, msg.body.trim())

  let participants = await msg.aux.participants
  const botId = msg.aux.client.info.wid._serialized
  participants = participants.filter((p) => p.id._serialized !== botId)

  const random = Math.floor(Math.random() * (participants.length))
  const winner = participants[random]

  const winnerContact = await msg.aux.client.getContactById(winner.id._serialized)

  let message = `{🎉|🎊|🥳|✨|🌟} - {@${winnerContact.id.user} parabéns| {Meus p|P}arabéns @${winnerContact.id.user}}! {Você|Tu|Vc} {ganhou|venceu|acaba de ganhar} o {incrível |super |magnífico |maravilhoso |fantástico |excepcional |}{sorteio|concurso|prêmio}`
  message = hasText ? `${message} de *${msg.body.trim()}*!` : message + '!'
  await msg.aux.chat.sendMessage(spintax(message), {
    mentions: [winnerContact]
  })

  await msg.react(spintax('{🎉|🎊|🥳}'))
}

/**
 * Draw a adm from group
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function giveawayAdminsOnly (msg) {
  const hasText = msg.body.split(' ').length > 1
  const text = hasText ? msg.body : ''

  let participants = await msg.aux.participants.filter((p) => p.isAdmin || p.isSuperAdmin)
  const botId = msg.aux.client.info.wid._serialized
  participants = participants.filter((p) => p.id._serialized !== botId)

  const random = Math.floor(Math.random() * (participants.length))
  const winner = participants[random]

  const winnerContact = await msg.aux.client.getContactById(winner.id._serialized)

  let message = `🎉 - @${winnerContact.id.user} parabéns! Você ganhou o sorteio`
  message = hasText ? `${message} *${text.trim()}*!` : message + '!'
  await msg.aux.chat.sendMessage(message, {
    mentions: [winnerContact]
  })

  await msg.react('🎉')
}

/**
 * Send the message but invisible mentioning all members of the group
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function markAllMembers (msg) {
  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !todos *você* precisa ser admin')
  }

  msg.body = msg.body.charAt(0).toUpperCase() + msg.body.slice(1)

  const participants = msg.aux.participants.map((p) => p.id._serialized)
  const contactArray = []
  for (let i = 0; i < participants.length; i++) {
    contactArray.push(await msg.aux.client.getContactById(participants[i]))
  }

  await msg.aux.chat.sendMessage(msg.body ? `📣 - ${msg.body}` : '📣', { mentions: contactArray })
  await msg.react('📣')
}

/**
 * Call group Admins
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function callAdmins (msg) {
  const admins = msg.aux.admins
  console.log('admins', admins)
  const contactArray = []
  for (let i = 0; i < admins.length; i++) {
    contactArray.push(await msg.aux.client.getContactById(admins[i]))
  }
  console.log('contactArray', contactArray)
  await msg.aux.chat.sendMessage('👑 - Atenção administradores!', { mentions: contactArray })
  await msg.react('👑')
}

/**
 * Close group for admins only
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function closeGroup (msg) {
  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !fechar *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !fechar *você* precisa ser admin')
  }

  await msg.aux.chat.setMessagesAdminsOnly(true)
  await msg.react('🔒')
}

/**
 * Open group for everyone
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function openGroup (msg) {
  if (!msg.aux.isBotAdmin) {
    return await msg.reply('para usar o !abrir *o bot* precisa ser admin')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('para usar o !abrir *você* precisa ser admin')
  }

  await msg.aux.chat.setMessagesAdminsOnly(false)
  await msg.react('🔓')
}
