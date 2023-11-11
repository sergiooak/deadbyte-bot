import { getWaitTime, getQueueLength } from '../queue.js'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import reactions from '../../config/reactions.js'
import { createUrl } from '../../config/api.js'
import spintax from '../../utils/spintax.js'
import { getCommands } from '../../db.js'
import logger from '../../logger.js'
import FormData from 'form-data'
import 'dayjs/locale/pt-br.js'
import fetch from 'node-fetch'
import mime from 'mime-types'
import sharp from 'sharp'
import dayjs from 'dayjs'

dayjs.locale('pt-br')
dayjs.extend(relativeTime)

//
// ================================ Main Functions =================================
//
/**
 * Returns general statistics
 * @param {wwebjs.Message} msg
 */
export async function stats (msg) {
  await msg.reply('Dummy text for stats function')
}

/**
 * Returns full statistics
 * @param {wwebjs.Message} msg
 */
export async function fullStats (msg) {
  await msg.reply('Dummy text for fullStats function')
}

/**
 * Returns statistics for the week
 * @param {wwebjs.Message} msg
 */
export async function weekStats (msg) {
  await msg.reply('Dummy text for weekStats function')
}

/**
 * Returns statistics for the hour
 * @param {wwebjs.Message} msg
 */
export async function hourStats (msg) {
  await msg.reply('Dummy text for hourStats function')
}
//
// ================================== Helper Functions ==================================
//
