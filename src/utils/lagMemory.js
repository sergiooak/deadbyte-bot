import 'dayjs/locale/pt-br.js'
import dayjs from 'dayjs'
dayjs.locale('pt-br')
//
// ===================================== Variables ======================================
//

/**
 * @typedef {number} Lag
 * A single lag value in seconds
 */

/**
 * @typedef {Object} LagTime
 * @property {string} time - The time in the format 'YYYY-MM-DD-HH-MM'
 * @property {number} averageLag - The average lag in seconds
 * @property {number} messages - The number of messages in that minute
 * An object with the time, the average lag and the number of messages in that minute.
 */

/**
 * @typedef {LagTime[]} LagArray
 * An array of LagTime
 */

/**
 * @typedef {Object<string, LagArray>} LagMemory
 * An object where each key is a string in the format 'YYYY-MM-DD-HH-MM' and each value is a LagArray
 */

/** @type {LagMemory} */
const lags = {}

const keyFormat = 'YYYY-MM-DDTHH:mm'

//
// =================================== Main Functions ===================================
//

/**
 * Add a lag to the memory.
 * @param {Lag} lag - The lag to add
 */
export function addLag (lag) {
  const date = dayjs()
  const key = date.format(keyFormat)

  lag = Math.floor(lag)
  if (lag < 0) {
    lag = 0
  }

  if (!lags[key]) {
    lags[key] = []
  }
  lags[key].push(lag)
}

/**
 * Get the lags from the memory.
 * @param {number} minutes - The minutes to get the lags from.
 * @returns {LagArray} - An array of lags.
 */
export function getLags (minutes = 60) {
  const result = []
  const timeAgo = dayjs().subtract(minutes, 'minutes')

  for (const key in lags) {
    const date = dayjs(key, keyFormat)
    if (date.isAfter(timeAgo)) {
      const lagArray = lags[key]
      const averageLag = lagArray.reduce((a, b) => a + b, 0) / lagArray.length

      result.push({
        time: key,
        averageLag: Math.floor(averageLag),
        messages: lagArray.length
      })
    }
  }

  return normalizeAndInterpolate(result)
}

//
// ================================== Helper Functions ==================================
//
/**
 * Normalize the lags and interpolate the missing values.
 * @param {LagArray} lags - The lags to normalize
 * @returns {LagArray} - The normalized lags
 */
function normalizeAndInterpolate (lags) {
  if (lags.length === 0) return []

  const missing = []
  const keyFormat = 'YYYY-MM-DD HH:mm:ss'

  for (let i = 0; i < lags.length - 1; i++) {
    const current = dayjs(lags[i].time, keyFormat)
    const next = dayjs(lags[i + 1].time, keyFormat)
    const diff = next.diff(current, 'minutes')

    if (diff <= 1) continue

    const currentLag = lags[i].averageLag
    const nextLag = lags[i + 1].averageLag
    const lagDiff = nextLag - currentLag

    for (let j = 1; j < diff; j++) {
      const proportion = (lagDiff / diff) * j
      const averageLag = currentLag + proportion

      const missingTime = {
        time: current.add(j, 'minutes').format(keyFormat),
        averageLag: Math.floor(averageLag),
        messages: 0
      }

      missing.push(missingTime)
    }
  }

  return [...lags, ...missing].sort((a, b) => dayjs(a.time, keyFormat).diff(dayjs(b.time, keyFormat)))
}

setInterval(() => {
  console.log(lags, getLags())
}
, 10_000)
