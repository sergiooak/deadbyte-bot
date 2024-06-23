import spintax from '../../utils/spintax.js'
/**
 * Ban user from group, reply to the user you want to ban or mark the @
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function ban (msg) {
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, false)
  if (!hasRequiredAdminPrivileges) return

  const targets = await extractTargetUserIds(msg, '{{banir|expulsar|remover} do grupo|dar ban}')

  await msg.aux.chat.removeParticipants(targets)
  await msg.react('🔨')
}

/**
 * Add user to group, reply to the user you want to unban or send the number
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function unban (msg) {
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, false)
  if (!hasRequiredAdminPrivileges) return

  const targets = await extractTargetUserIds(msg, '{adicionar|add} ao grupo', true)
  if (targets.length === 0) return

  await msg.aux.chat.addParticipants(targets)
  await msg.react('🔄')
}

/**
 * Promote user to admin, reply to the user you want to promote or mark the @
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function promote (msg) {
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, false)
  if (!hasRequiredAdminPrivileges) return

  const targets = await extractTargetUserIds(msg, '{{promover|dar|conceder} o cargo de admin|dar admin|promover a admin}')
  if (targets.length === 0) return

  await msg.aux.chat.promoteParticipants(targets)
  await msg.react('↗️')
}

/**
 * Demote user from admin, reply to the user you want to demote or mark the @
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function demote (msg) {
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, false)
  if (!hasRequiredAdminPrivileges) return

  const targets = await extractTargetUserIds(msg, '{rebaixar|{tirar|remover} o cargo de admin|tirar o admin}')
  if (targets.length === 0) return

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
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, false)
  if (!hasRequiredAdminPrivileges) return

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
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, true)
  if (!hasRequiredAdminPrivileges) return

  await msg.aux.chat.setMessagesAdminsOnly(true)
  await msg.react('🔒')
}

/**
 * Open group for everyone
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function openGroup (msg) {
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, true)
  if (!hasRequiredAdminPrivileges) return

  await msg.aux.chat.setMessagesAdminsOnly(false)
  await msg.react('🔓')
}

/**
 * Accept all group membership requests
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function acceptAll (msg) {
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, true)
  if (!hasRequiredAdminPrivileges) return

  const membershipRequests = await checkGroupMembershipRequests(msg)
  if (membershipRequests === false) return

  let message = '🤖 - '
  message += `{Há|Tem|Achei} ${membershipRequests} {solicitações|requisições} de entrada {no|para o} grupo{!|!!|!!!}`
  message += '\n\nVou *{aprovar|aceitar}* todas{ elas|}.'
  await msg.reply(spintax(message))

  await msg.aux.chat.approveGroupMembershipRequests()
  await msg.react('🟢')
}

/**
 * Reject all group membership requests
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function rejectAll (msg) {
  const hasRequiredAdminPrivileges = await checkAdminPrivileges(msg, true)
  if (!hasRequiredAdminPrivileges) return

  const membershipRequests = await checkGroupMembershipRequests(msg)
  if (membershipRequests === false) return

  let message = '🤖 - '
  message += `{Há|Tem|Achei} ${membershipRequests} {solicitações|requisições} de entrada {no|para o} grupo{!|!!|!!!}`
  message += '\n\nVou *{rejeitar|recusar}* todas{ elas|}.'
  await msg.reply(spintax(message))

  await msg.aux.chat.rejectGroupMembershipRequests()
  await msg.react('🛑')
}

//
// ================================== Helper Functions ==================================
//

/**
 * Checks if user and bot have admin privileges for a command.
 *
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @param {boolean} [botNeedsToBeAdmin=true] - If bot needs admin privileges.
 * @returns {Promise<boolean>} - True if admin privileges are met.
 */
async function checkAdminPrivileges (msg, botNeedsToBeAdmin = true) {
  const command = `${msg.aux.prefix}${msg.aux.function}` // Command example: !ban, .fecha

  // Check if user needs to be admin
  const userNeedsAdmin = msg.aux?.db?.command?.isGroupAdminOnly ?? false
  if (userNeedsAdmin && !msg.aux.isSenderAdmin) {
    await msg.reply(`❌ - Para usar o comando *${command}*, você precisa ser admin do grupo.`)
    return false
  }

  // Check if bot needs to be admin
  if (botNeedsToBeAdmin && !msg.aux.isBotAdmin) {
    await msg.reply(`❌ - Para usar o comando *${command}*, o bot precisa ser admin do grupo.`)
    return false
  }

  return true
}

/**
 * Extracts target user IDs from a message based on mentions, quoted messages, or phone numbers.
 *
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @param {string} [action] - Optional action description for the error message.
 * @param {boolean} [extractNumbers=false] - If true, extracts phone numbers from the message text.
 * @returns {Promise<Array<string>>} - An array of target user IDs or an empty array if none found.
 */
async function extractTargetUserIds (msg, action = '', extractNumbers = false) {
  let targets = msg.aux.mentions.length > 0 ? msg.aux.mentions : []

  if (msg.hasQuotedMsg && targets.length === 0) {
    const quotedMsg = await msg.getQuotedMessage()
    const author = await quotedMsg.getContact()
    targets.push(author.id._serialized)
  }

  if (extractNumbers) {
    const numbers = msg.body.match(/(\d{2,})/g)
    targets = numbers ? numbers.map(number => `${number}@c.us`) : []
  }

  if (targets.length === 0) {
    const functionUsed = `${msg.aux.prefix}${msg.aux.function}`
    const actionMessage = action ? `que deseja ${action} ` : ''
    const methodMessage = extractNumbers
      ? '`responder a mensagem da pessoa` ' + actionMessage + '*OU* `mandar o número completo dela`'
      : '`responder a mensagem da(s) pessoa(s)` ' + actionMessage + '*OU* `mencionar o @ dela(s)`'
    const exampleMessage = extractNumbers ? `\n\n_Exemplo: ${functionUsed} 5511999999999_` : ''

    const finalMessage = `❌ - Para usar {o|o comando|a função} *${functionUsed}*, você precisa ${methodMessage}{!|!!|!!!}${exampleMessage}`
    await msg.reply(spintax(finalMessage))
  }

  return targets
}

/**
 * Checks if there are group membership requests and sends a message if there are none.
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Promise<number|boolean>} - The number of membership requests or false if there are none.
 */
async function checkGroupMembershipRequests (msg) {
  const membershipApprovalRequests = await msg.aux.chat.getGroupMembershipRequests()

  let message = '🤖 - '
  if (membershipApprovalRequests.length === 0) {
    message += 'Não {há solicitações|{tem|achei} nenhuma solicitação} de entrada {no|nesse} grupo{ no momento|}{!|!!|!!!}'
    await msg.reply(spintax(message))
    return false
  }

  return membershipApprovalRequests.length
}
