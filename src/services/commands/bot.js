/**
 * Sticker creation, modification etc
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    uptime: aux.function === 'uptime',
    react: aux.function === 'react'
  }
}
