import { Configuration, OpenAIApi } from 'openai'
import reactions from '../../config/reactions.js'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(configuration)

/**
 * Use chat gpt
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function gpt (msg) {
  await msg.react(reactions.wait)
  if (!msg.body) return msg.reply('Para utilizar o *!gpt* mande uma mensagem junto com o comando.')

  const messages = msg.aux.history.map(msg => {
    return {
      role: msg._data.self === 'out' ? 'assistant' : 'user',
      content: msg.body
    }
  })

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages
  })

  const response = completion.data.choices[0]?.message?.content
  console.log(response)
  await msg.reply(response)
  await msg.react('🧠')
}

/**
 * "Translate" the message into emojis
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function emojify (msg) {
  await msg.react(reactions.wait)

  if (!msg.body) return msg.reply('Para utilizar o *!emojify* mande uma mensagem junto com o comando.')

  const messages = msg.aux.history.map(msg => {
    return {
      role: msg._data.self === 'out' ? 'assistant' : 'user',
      content: msg.body
    }
  })

  const prompt = {
    role: 'system',
    content: 'I want you to translate the sentences I wrote into emojis. The use will write the sentence, and you will express it with emojis. I just want you to express it with emojis. I don\'t want you to reply with anything but emoji tranlation'
  }

  messages.unshift(prompt) // Add prompt object at the beginning of messages array

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0
  })

  const response = completion.data.choices[0]?.message?.content

  await msg.reply(response)
  await msg.react('😀')
}

/**
 * Translate the message into emojis
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function translate (msg) {
  await msg.react(reactions.wait)
  const prompt = {
    role: 'system',
    content: `Returns the sentence translated into the output language.

    Automatically detect the input language.
    The output language will be english if the input language is portuguese, and portuguese if the input language is english.
    Except if the user specify the output language, saying something like "translate es" or "translate chinese "something"".
    
    Do not interact with the user, just return the translations of what the user said.
    Localize the translations, adapt slang and other things to the language feel natural.
    
    Prefix the response with a flag representing th output language, like "🇪🇸" or or "🇧🇷" or "🇺🇸" etc..
    Example: '🇪🇸 - "Hola, ¿cómo estás?"' or '🇧🇷 - "Oi, tudo bem?"' or '🇺🇸 - "Hi, how are you?"'
    `
  }

  const messages = [prompt, {
    role: 'user',
    content: `translate "${msg.aux.history.lenght > 1 ? msg.body + msg.aux.history.at(-2).body : msg.body}"`
  }]

  console.log(messages)

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0
  })

  const response = completion.data.choices[0]?.message?.content
  console.log(response)
  await msg.reply(response)
  await msg.react('🌐')
}

/**
 * Calculate the message
 * @param {import('whatsapp-web.js').Message} msg
 */
export async function calculate (msg) {
  await msg.react(reactions.wait)

  const messages = msg.aux.history.map(msg => {
    return {
      role: msg._data.self === 'out' ? 'assistant' : 'user',
      content: msg.body
    }
  })

  const prompt = {
    role: 'system',
    content: `I want you to act like a mathematician
    I will type mathematical expressions and you will respond with the result of calculating the expression
    I want you to answer the line by line calculations
    Do not write explanations
    Always wrap the result in * like *18* or *x = 2*
    If you need to explain something, always do it in portuguese, but avoid it if possible
    
    Example: 
    2 + 2 * 8
    2 + (2 * 8)
    2 + 16
    ----------
    *18*
    `
  }

  messages.unshift(prompt) // Add prompt object at the beginning of messages array

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0
  })

  const response = completion.data.choices[0]?.message?.content

  await msg.reply(response)
  await msg.react('😀')
}
