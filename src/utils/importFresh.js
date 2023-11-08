import fs from 'node:fs'
import path from 'node:path'

//
// ===================================== Variables ======================================
//

/**
   * @typedef {Object} ModuleCacheItem
   * @property {*} module - The imported module.
   * @property {number} lastModified - The last modified time of the module file.
   */

/** @type {Object<string, ModuleCacheItem>} */
const moduleCache = {}

//
// ==================================== Main Function ====================================
//

/**
 * Import a module and force it to be reloaded from disk if it has changed.
 * @param {string} modulePath - The path to the module to import.
 * @returns {Promise<*>} - A promise that resolves to the imported module.
 */
const importFresh = async (modulePath) => {
  const modulePathWithPrefix = path.join('src', modulePath)
  const modulePathConverted = `../../${modulePathWithPrefix}`
  const absoluteModulePath = path.resolve(modulePathWithPrefix)
  const stats = fs.statSync(absoluteModulePath)
  const lastModified = stats.mtimeMs

  if (moduleCache[modulePath] && moduleCache[modulePath].lastModified === lastModified) {
    return moduleCache[modulePath].module
  }

  const module = await import(`${modulePathConverted}?update=${new Date()}`)
  moduleCache[modulePath] = { module, lastModified }
  return module
}

export default importFresh
