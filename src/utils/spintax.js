/**
 * Spin text variations with spintax syntax
 * @param {string} text
 * @returns {string}
 * @example
 * let text = 'Bom {dia|tarde|noite} {pessoal|galera|povo}!'
 * console.log(spintax(text)) // Bom dia pessoal!
 * @see https://medium.com/@instarazzo/what-is-spintax-format-and-what-are-its-applications-on-instarazzo-6e1b812cc208
 */

export default function spintax (text) {
  const regEx = /{([^{}]+?)}/
  let matches, options, random

  while ((matches = regEx.exec(text)) !== null) {
    options = matches[1].split('|')
    random = Math.floor(Math.random() * options.length)
    text = text.replace(matches[0], options[random])
  }
  return text
}
