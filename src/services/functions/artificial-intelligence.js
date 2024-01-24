import reactions from '../../config/reactions.js'
import { createUrl } from '../../config/api.js'
import fetch from 'node-fetch'

/**
 * Use chat gpt
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function gpt (msg) {
  await msg.react(reactions.wait)
  if (!msg.body) {
    return msg.reply('Para utilizar o *!gpt* mande uma mensagem junto com o comando.')
  }

  const messages = msg.aux.history.map(msg => {
    return {
      role: msg._data.self === 'out' ? 'assistant' : 'user',
      content: msg.body
    }
  })

  await msg.aux.chat.sendStateTyping()
  const url = await createUrl('artificial-intelligence', 'gpt', {})
  // POST request to the API with messages on json body
  try {
    const timeout = setTimeout(() => {
      throw new Error('Timeout')
    }, 30_000)

    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ messages }),
      headers: { 'Content-Type': 'application/json' }
    })

    clearTimeout(timeout)

    const data = await res.json()

    await msg.reply(data.result)
    await msg.aux.chat.clearState()
    await msg.react('🧠')
  } catch (error) {
    await msg.reply('❌ - Aconteceu um erro inesperado, tente novamente mais tarde.\nznSe possivel, reporte o erro para o desenvolvedor no grupo:\nhttps://chat.whatsapp.com/CBlkOiMj4fM3tJoFeu2WpR')
    await msg.aux.chat.clearState()
    await msg.react('❌')
  }
}

/**
 * Use DeadByte version of GPT
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function bot (msg) {
  await msg.react(reactions.wait)
  if (!msg.body) {
    return msg.reply('Para utilizar o *!gpt* mande uma mensagem junto com o comando.')
  }

  const messages = msg.aux.history.map(msg => {
    return {
      role: msg._data.self === 'out' ? 'assistant' : 'user',
      content: msg.body
    }
  })

  await msg.aux.chat.sendStateTyping()
  const url = await createUrl('artificial-intelligence', 'bot', {})
  // POST request to the API with messages on json body
  try {
    const timeout = setTimeout(() => {
      throw new Error('Timeout')
    }, 30_000)

    const res = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ messages }),
      headers: { 'Content-Type': 'application/json' }
    })

    clearTimeout(timeout)

    const data = await res.json()

    await msg.reply(data.result)
    await msg.aux.chat.clearState()
    await msg.react('🧠')
  } catch (error) {
    await msg.reply('❌ - Aconteceu um erro inesperado, tente novamente mais tarde.\nznSe possivel, reporte o erro para o desenvolvedor no grupo:\nhttps://chat.whatsapp.com/CBlkOiMj4fM3tJoFeu2WpR')
    await msg.aux.chat.clearState()
    await msg.react('❌')
  }
}

/**
 * "Translate" the message into emojis
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function emojify (msg) {
  // await msg.react(reactions.wait)

  // if (!msg.body && !msg.hasQuotedMsg) return msg.reply('Para utilizar o *!emojify* mande uma mensagem junto com o comando.\nOu responda a uma mensagem com o comando.')

  // const messages = [
  //   {
  //     role: 'user',
  //     content: msg.hasQuotedMsg ? msg.aux.quotedMsg.body : msg.body
  //   }
  // ]

  // const prompt = {
  //   role: 'system',
  //   content: 'I want you to translate the sentences I wrote into emojis. The use will write the sentence, and you will express it with emojis. I just want you to express it with emojis. I don\'t want you to reply with anything but emoji tranlation'
  // }

  // messages.unshift(prompt) // Add prompt object at the beginning of messages array

  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-3.5-turbo',
  //   max_tokens: 4096 / 8,
  //   temperature: 0,
  //   messages
  // })

  // const response = completion.choices[0]?.message?.content

  // await msg.reply(response)
  // await msg.react('😀')
}

/**
 * Translate the message into emojis
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function translate (msg) {
  // await msg.react(reactions.wait)
  // const prompt = {
  //   role: 'system',
  //   content: `Returns the sentence translated into the output language.

  //   Automatically detect the input language.
  //   The output language will be english if the input language is portuguese, and portuguese if the input language is english.
  //   Except if the user specify the output language, saying something like "translate es" or "translate chinese "something"".

  //   Do not interact with the user, just return the translations of what the user said.
  //   Localize the translations, adapt slang and other things to the language feel natural.

  //   Prefix the response with a flag representing th output language, like "🇪🇸" or or "🇧🇷" or "🇺🇸" etc..
  //   Example: '🇪🇸 - "Hola, ¿cómo estás?"' or '🇧🇷 - "Oi, tudo bem?"' or '🇺🇸 - "Hi, how are you?"'
  //   `
  // }

  // const messageToTranslate = msg.hasQuotedMsg ? msg.aux.quotedMsg.body : msg.body

  // const messages = [prompt, {
  //   role: 'user',
  //   content: `translate ${msg.body ? msg.body + ' ' : ''}"${messageToTranslate}"`
  // }]

  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-3.5-turbo',
  //   max_tokens: 4096 / 4,
  //   temperature: 0,
  //   messages
  // })

  // const response = completion.choices[0]?.message?.content
  // await msg.reply(response)
  // await msg.react('🌐')
}

/**
 * Calculate the message
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function calculate (msg) {
  // await msg.react(reactions.wait)

  // const messages = msg.aux.history.map(msg => {
  //   return {
  //     role: msg._data.self === 'out' ? 'assistant' : 'user',
  //     content: msg.body
  //   }
  // })

  // const prompt = {
  //   role: 'system',
  //   content: `I want you to act like a mathematician
  //   I will type mathematical expressions and you will respond with the result of calculating the expression
  //   I want you to answer the line by line calculations
  //   Do not write explanations
  //   Always wrap the result in * like *18* or *x = 2*
  //   If you need to explain something, always do it in portuguese, but avoid it if possible

  //   Example:
  //   2 + 2 * 8
  //   2 + (2 * 8)
  //   2 + 16
  //   ----------
  //   *18*
  //   `
  // }

  // messages.unshift(prompt) // Add prompt object at the beginning of messages array

  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-3.5-turbo',
  //   max_tokens: 4096 / 8,
  //   temperature: 0,
  //   messages
  // })

  // const response = completion.choices[0]?.message?.content

  // await msg.reply(response)
  // await msg.react('😀')
}

/**
 * Simsimi chat
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 */
export async function simsimi (msg) {
  await msg.react(reactions.wait)

  const version = 'v1' // v1 or v2
  // const url = 'https://api.simsimi.vn/v1/simtalk'
  const url = `https://api.simsimi.vn/${version}/simtalk`
  const text = msg.body
  const lc = 'pt'

  const params = new URLSearchParams()
  params.append('text', text)
  params.append('lc', lc)
  params.append('key', '')

  const res = await fetch(url, {
    method: 'POST',
    body: params
  })

  const data = await res.json()
  await msg.reply(`*SimSimi:* ${data.message.trim()}`)
  await msg.react('🐥')
}
