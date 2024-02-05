import logger from '../../logger.js'
import { getAggregateVotesInPollMessage } from '@whiskeysockets/baileys'
import { getMessage } from '../../index.js'

/**
 * Connection state has been updated -- WS closed, opened, connecting etc.
 * @param {import('@whiskeysockets/baileys').BaileysEventMap['messages.update']} event
 */
export default async (event) => {
  logger.trace('Messages updated\n' + JSON.stringify(event, null, 2))
  for (const { key, update } of event) {
    if (update.pollUpdates) {
      const pollCreation = await getMessage(key)
      if (pollCreation) {
        console.log(
          'got poll update, aggregation: ',
          getAggregateVotesInPollMessage({
            message: pollCreation,
            pollUpdates: update.pollUpdates
          })
        )
      }
    }
  }
}
