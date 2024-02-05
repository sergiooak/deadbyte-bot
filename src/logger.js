import pino from 'pino'

/**
 * @type {import('pino').Logger}
 * @see https://getpino.io/#/
 */
export default pino(
  {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
)
