import relativeTime from 'dayjs/plugin/relativeTime.js'
import { getBot, getDBUrl, getToken } from '../../db.js'
// import { getClient } from '../../spawn.js'
import 'dayjs/locale/pt-br.js'
import dayjs from 'dayjs'
import qs from 'qs'
import wwebjs from 'whatsapp-web.js'

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
dayjs.locale('pt-br')
dayjs.extend(relativeTime)

//
// ================================ Main Functions =================================
//

/**
 * Tests functions
 * @param {import('../../types').WWebJSMessage} msg
 */
export async function debug (msg) {
  const debugEmoji = '🐛'
  await msg.react(debugEmoji)

  // debug code here
}

/**
 * Sync the bot's display name and profile picture with the database
 * @param {import('../../types').WWebJSMessage} msg
 */
export async function sync (msg) {
  const syncEmoji = '🔄'
  await msg.react(syncEmoji)

  try {
    const botData = await getBotData()
    const { pushname, profilePicture } = botData

    if (!pushname) {
      throw new Error('Bot name is null or undefined')
    }

    if (!profilePicture) {
      throw new Error('Bot profile picture is null or undefined')
    }

    // Update the bot's display name
    await msg.client.setDisplayName(pushname)

    // Update the bot's profile picture
    const media = await wwebjs.MessageMedia.fromUrl(profilePicture.url, { unsafeMime: true })
    await msg.client.setProfilePicture(media)

    let message = `${syncEmoji} - Bot sincronizado com sucesso!`
    message += '\n\n'
    message += `Nome: *${pushname}*`
    message += '\n'
    message += `Imagem: *${profilePicture.url}*`
    await msg.reply(message)
  } catch (error) {
    console.error(error)
    await msg.reply(`${syncEmoji} - Ocorreu um erro ao sincronizar o bot.\n\n${error.message}`)
  }
}

//
// ================================== Helper Functions ==================================
//
/**
 * Gets the bot's data from the database
 * @returns {Promise<{
 *   pushname: string,
 *   profilePicture: {
 *     url: string
 *   }
 * }>}
 */
async function getBotData () {
  const dbUrl = getDBUrl()
  const token = getToken()
  const botId = getBot()

  const findQuery = qs.stringify(
    {
      populate: ['profilePicture']
    },
    {
      encodeValuesOnly: true // prettify URL
    }
  )
  const find = await fetch(`${dbUrl}/bots/${botId}?${findQuery}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  const { data } = await find.json()
  return data
}
