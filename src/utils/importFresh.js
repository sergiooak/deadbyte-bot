/**
 * Import a module and force it to be reloaded from disk.
 * @param {*} modulePath
 * @returns {Promise<*>}
 */
export default async function importFresh (modulePath) {
  return await import(`${modulePath}?update=${new Date()}`)
}
