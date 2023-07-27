import pino from 'pino'

const transport = pino.transport({
  targets: [
    {
      level: 'warn',
      target: 'pino/file',
      options: {
        destination: 'errors.log'
      }
    },
    {
      level: 'trace',
      target: 'pino-pretty',
      options: {}
    }
  ]
})

/**
 * @type {import('pino').Logger}
 * @see https://getpino.io/#/
 */
export default pino(
  {
    level: 'info'
  },
  transport
)
