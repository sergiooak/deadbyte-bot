import fs from 'fs/promises'

export const baseUrl = process.env.API_URL || 'https://v1.deadbyte.com.br'
export const apiKey = process.env.API_KEY

/**
 * @typedef {Object} EndpointCategory
 * @property {string} path
 * @property {string} name
 * @property {string} description
 * @property {Object.<string, Endpoint>} endpoints
 *
 * @typedef {Object} Endpoint
 * @property {string} path
 * @property {string} name
 * @property {string} description
 * @property {Object.<string, EndpointParam>} params
 *
 * @typedef {Object} EndpointParam
 * @property {string} type
 * @property {boolean} required
 * @property {string} description
 *
*/

/**
 * Avaliable endpoints from the API, populated on the fly
 * @returns {Promise<Object.<string, EndpointCategory>>} avaliableEndpoints
 */
async function avaliableEndpoints () {
  const avaliableEndpoints = {}
  const endpoints = await fs.readdir('./src/config/api')
  await Promise.all(endpoints.map(async endpoint => {
    const endpointModule = await import(`./api/${endpoint}`)
    avaliableEndpoints[endpointModule.default.path] = endpointModule.default
  }))
  return avaliableEndpoints
}

/**
 * Create an url to an endpoint, validating the params
 * @param {string} category
 * @param {string} endpoint
 * @param {Object.<string, string>} params
 * @returns {Promise<string>} url
 * @throws {Error} if category or endpoint are not found
 * @throws {Error} if required params are missing
 * @throws {Error} if there are extra params
 * @example
 * const url = await createUrl('imageCreator', 'ttp', { message: 'Hello World', subtitle: true });
*/
export async function createUrl (category, endpoint, params) {
  const endpoints = await avaliableEndpoints()
  if (!endpoints[category]) throw new Error(`Category ${category} not found!`)
  if (!endpoints[category].endpoints[endpoint]) throw new Error(`Endpoint ${endpoint} not found in category ${category}!`)

  const endpointObj = endpoints[category].endpoints[endpoint]
  const endpointParams = Object.keys(endpointObj.params)

  // check if all required params are present
  const missingParams = endpointParams.filter(param => endpointObj.params[param].required && !params[param])
  if (missingParams.length > 0) throw new Error(`Missing required params: ${missingParams.join(', ')}`)

  // check if there are any extra params
  const extraParams = Object.keys(params).filter(param => !endpointParams.includes(param))
  if (extraParams.length > 0) throw new Error(`Extra params: ${extraParams.join(', ')}`)

  // create the url
  const categoryPath = endpoints[category].path
  const endpointPath = endpointObj.path
  const url = new URL(`${baseUrl}/${categoryPath}/${endpointPath}`)

  // add the api key
  url.searchParams.append('key', apiKey)

  // add the params, populating with default values if needed
  endpointParams.forEach(param => {
    if (params[param]) url.searchParams.append(param, params[param])
  })

  return url.toString()
}
