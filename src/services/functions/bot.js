import spintax from '../../utils/spintax.js'

//
// ================================ Main Functions =================================
//
/**
 * return uptime
 * @param {wwebjs.Message} msg
 */
export async function uptime (msg) {
  const uptime = process.uptime()
  const uptimeString = secondsToDhms(uptime)
  const clock = '{⏳|⌚|⏰|⏱️|⏲️|🕰️|🕛|🕧|🕐|🕜|🕑|🕝}'
  await msg.react(spintax(clock)) // react with random clock emoji
  const message = `${spintax(clock)} - ${uptimeString}`
  await msg.reply(message)
}

/**
 * React with a random emoji
 * @param {wwebjs.Message} msg
 */
export async function react (msg) {
  const emojis = ['✌', '😂', '😝', '😁', '😱', '👉', '🙌', '🍻', '🔥', '🌈', '☀', '🎈', '🌹', '💄', '🎀', '⚽', '🎾', '🏁', '😡', '👿', '🐻', '🐶', '🐬', '🐟', '🍀', '👀', '🚗', '🍎', '💝', '💙', '👌', '❤', '😍', '😉', '😓', '😳', '💪', '💩', '🍸', '🔑', '💖', '🌟', '🎉', '🌺', '🎶', '👠', '🏈', '⚾', '🏆', '👽', '💀', '🐵', '🐮', '🐩', '🐎', '💣', '👃', '👂', '🍓', '💘', '💜', '👊', '💋', '😘', '😜', '😵', '🙏', '👋', '🚽', '💃', '💎', '🚀', '🌙', '🎁', '⛄', '🌊', '⛵', '🏀', '🎱', '💰', '👶', '👸', '🐰', '🐷', '🐍', '🐫', '🔫', '👄', '🚲', '🍉', '💛', '💚']
  const randomNumber = Math.floor(Math.random() * (emojis.length + 1)) + 1 // most truish random number between 1 and X
  const index = randomNumber - 1 // random number between 1 and X + 1, so we need to subtract 1 to get the correct index
  await msg.react(emojis[index])
}

//
// ================================== Helper Functions ==================================
//
function secondsToDhms (seconds) {
  const d = Math.floor(seconds / (3600 * 24))
  const h = Math.floor(seconds % (3600 * 24) / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  const s = Math.floor(seconds % 60)
  return `${d > 0 ? `${d}:` : ''}${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
}
