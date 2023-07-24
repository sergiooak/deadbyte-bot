const baseUrl = process.env.API_URL || 'https://v1.deadbyte.com.br';
const apiKey = process.env.API_KEY;

if (!apiKey) throw new Error('API_KEY not found! Grab one at https://api.deadbyte.com.br');

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
 * @property {string} default
 * @property {string} description
 * 
*/

/**
 * Image Creator
 * @type {EndpointCategory}
*/
const imageCreator = {
    path: 'image-creator',
    name: 'Image Creator',
    description: 'Create images on the fly',
    endpoints: {
        ttp: {
            path: 'ttp',
            name: 'Text to Picture',
            description: 'Create a 512x512 image with text',
            params: {
                message: {
                    type: 'string',
                    required: true,
                    description: 'Text to be written on the image',
                },
                subtitle: {
                    type: 'boolean',
                    required: false,
                    default: 'false',
                    description: 'If the text should be written on the bottom of the image',
                },
            },
        }
    },
};

/**
 * Avaliable endpoints
 */
const avaliableEndpoints = {
    imageCreator,
};

/**
 * Create an url to an endpoint, validating the params
 * @param {string} category
 * @param {string} endpoint
 * @param {Object.<string, string>} params
 * @returns {string} url
 * @throws {Error} if category or endpoint are not found
 * @throws {Error} if required params are missing   
 * @throws {Error} if there are extra params
 * @example
 * const url = createUrl('imageCreator', 'ttp', { message: 'Hello World', subtitle: true });
*/
export function createUrl(category, endpoint, params) {
    if (!avaliableEndpoints[category]) throw new Error(`Category ${category} not found!`);
    if (!avaliableEndpoints[category].endpoints[endpoint]) throw new Error(`Endpoint ${endpoint} not found in category ${category}!`);

    const endpointObj = avaliableEndpoints[category].endpoints[endpoint];
    const endpointParams = Object.keys(endpointObj.params);

    // check if all required params are present
    const missingParams = endpointParams.filter(param => endpointObj.params[param].required && !params[param]);
    if (missingParams.length > 0) throw new Error(`Missing required params: ${missingParams.join(', ')}`);

    // check if there are any extra params
    const extraParams = Object.keys(params).filter(param => !endpointParams.includes(param));
    if (extraParams.length > 0) throw new Error(`Extra params: ${extraParams.join(', ')}`);

    // create the url
    const url = new URL(`${baseUrl}${category}/${endpoint}`);

    // add the api key
    url.searchParams.append('key', apiKey);

    // add the params, populating with default values if needed
    endpointParams.forEach(param => {
        const value = params[param] || endpointObj.params[param].default;
        url.searchParams.append(param, value);
    });

    return url.toString();
}