/**
 * Determines if the given number should be considered plural based on the specified locale.
 *
 * @param {number} number - The number to check for plurality.
 * @param {string} [locale='en-US'] - The locale to use for determining plurality. Defaults to 'en-US'.
 * @returns {boolean} - Returns true if the number is considered plural in the specified locale, otherwise false.
 */
export function isPlural (number, locale = 'en-US') {
  // English as default because 0 not being plural is weird
  const pluralRules = new Intl.PluralRules(locale)
  const pluralType = pluralRules.select(number)
  return pluralType === 'other'
}
