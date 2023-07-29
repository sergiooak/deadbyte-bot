/**
 * Command prefixes
 * @type {string[]}
 * @example "!command" or .command etc...
 */
export const prefixes = ['!', '\\.', '#', '/']

/**
 * If none command is found using this prefixes, the message will be treated as a commandless message
 * @type {string[]}
 * @see "#noCommand" will be treated as a commandless message if no matching command is found
 */
export const prefixesWithFallback = ['#']

export const name = process.env.BOT_NAME || 'DeadByte'
export const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

export default {
  prefixes,
  prefixesWithFallback,
  name,
  chromePath
}
