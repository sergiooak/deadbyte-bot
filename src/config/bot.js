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
