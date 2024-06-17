import spintax from '../../utils/spintax.js'
/**
 * Ban user from group, reply to the user you want to ban or mark the @
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function ban (msg) {
  const hasMentions = msg.aux.mentions.length > 0
  const hasQuotedMsg = msg.hasQuotedMsg
  const targets = hasMentions ? msg.aux.mentions : []
  if (hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage()
    const author = await quotedMsg.getContact()
    targets.push(author.id._serialized)
  }

  console.log('🎯 - Targets:', targets)

  if (targets.length === 0) {
    return await msg.reply('❌ - Para usar o !ban você precisa `responder a mensagem da pessoa` que deseja banir *ou* `mencionar o @ dela`')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('❌ - Para usar o !ban *você* precisa ser admin')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('❌ - Para usar o !ban *o bot* precisa ser admin')
  }

  await msg.aux.chat.removeParticipants(targets)
  await msg.react('🔨')
}

/**
 * Add user to group, reply to the user you want to unban or send the number
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function unban (msg) {
  const hasQuotedMsg = msg.hasQuotedMsg
  const targets = []
  if (hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage()
    const author = await quotedMsg.getContact()
    targets.push(author.id._serialized)
  }
  // get the number from the message
  const regexToGetNumber = /(\d{2,})/g
  const numbers = msg.body.match(regexToGetNumber)
  if (numbers) {
    for (let i = 0; i < numbers.length; i++) {
      targets.push(`${numbers[i]}@c.us`)
    }
  }
  console.log('🎯 - Targets:', targets)

  if (targets.length === 0) {
    return await msg.reply('❌ - Para usar o !desban você precisa `responder a mensagem da pessoa` que deseja desbanir *ou* `mencionar mandar o número completo dela`\n\nExemplo: `!add 5511999999999`')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('❌ - Para usar o !desban *você* precisa ser admin')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('❌ - Para usar o !desban *o bot* precisa ser admin')
  }

  await msg.aux.chat.addParticipants(targets)
  await msg.react('🔄')
}

/**
 * Promote user to admin, reply to the user you want to promote or mark the @
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function promote (msg) {
  const hasMentions = msg.aux.mentions.length > 0
  const hasQuotedMsg = msg.hasQuotedMsg
  const targets = hasMentions ? msg.aux.mentions : []
  if (hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage()
    const author = await quotedMsg.getContact()
    targets.push(author.id._serialized)
  }

  if (targets.length === 0) {
    return await msg.reply('❌ - Para usar o !promove você precisa `responder a mensagem da pessoa` que deseja promover *ou* `mencionar o @ da pessoa`')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('❌ - Para usar o !promove *você* precisa ser admin')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('❌ - Para usar o !promove *o bot* precisa ser admin')
  }

  await msg.aux.chat.promoteParticipants(targets)
  await msg.react('↗️')
}

/**
 * Demote user from admin, reply to the user you want to demote or mark the @
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function demote (msg) {
  const hasMentions = msg.aux.mentions.length > 0
  const hasQuotedMsg = msg.hasQuotedMsg
  const targets = hasMentions ? msg.aux.mentions : []
  if (hasQuotedMsg) {
    const quotedMsg = await msg.getQuotedMessage()
    const author = await quotedMsg.getContact()
    targets.push(author.id._serialized)
  }

  if (targets.length === 0) {
    return await msg.reply('❌ - Para usar o !rebaixa você precisa `responder a mensagem da pessoa` que deseja rebaixar *ou* `mencionar o @ dela`')
  }

  if (!msg.aux.isSenderAdmin) {
    return await msg.reply('❌ - Para usar o !rebaixa *você* precisa ser admin')
  }

  if (!msg.aux.isBotAdmin) {
    return await msg.reply('❌ - Para usar o !rebaixa *o bot* precisa ser admin')
  }

  await msg.aux.chat.demoteParticipants(targets)
  await msg.react('↘️')
}

/**
 * Draw a user from group
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function giveaway (msg) {
  const hasText = !!msg.body.trim()

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
 * @param {import('../../types.d.ts').WWebJSMessage} msg
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
 * @param {import('../../types.d.ts').WWebJSMessage} msg
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
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function callAdmins (msg) {
  const admins = msg.aux.admins
  const contactArray = []
  for (let i = 0; i < admins.length; i++) {
    contactArray.push(await msg.aux.client.getContactById(admins[i]))
  }
  await msg.aux.chat.sendMessage('👑 - Atenção administradores!', { mentions: contactArray })
  await msg.react('👑')
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

  await msg.aux.chat.setMessagesAdminsOnly(true)
  await msg.react('🔒')
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

  await msg.aux.chat.setMessagesAdminsOnly(false)
  await msg.react('🔓')
}
