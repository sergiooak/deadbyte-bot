import express from 'express'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'

const app = express()
const port = 3000
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
app.use(express.json()) // for parsing application/json

// In-memory store for spawned bots
const spawnedBots = {}

automaticallySpawnBots()

// Home route
app.get('/', async (req, res) => {
  const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'))
  res.send({
    name: packageJson.name,
    version: packageJson.version
  })
})

// Route to list spawned bots
app.get('/bots', (req, res) => {
  res.json(Object.keys(spawnedBots))
})

// Route to spawn a new bot
app.post('/bots', async (req, res) => {
  // dafaults name to a random string
  const { name = `${Math.random().toString(36).substring(7)}`, params } = req.body

  // make sure that name is Only alphanumeric characters, underscores and hyphens
  const parsedName = name.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!parsedName) {
    res.status(400).json({ message: 'Invalid bot name' })
    return
  }

  if (spawnedBots[parsedName]) {
    res.status(409).json({ message: `Bot ${parsedName} already exists` })
    return
  }

  const defaults = { /* add default params here */ }
  const botParams = { ...defaults, ...params }
  const [error, message, qrcode] = await spawnBot(parsedName, botParams)
  if (error) {
    res.status(500).json({ message })
  }
  res.json({ message, qrcode })
})

// Route to delete a spawned bot
app.delete('/bots/:name', async (req, res) => {
  const { name } = req.params
  const folder = `./.wwebjs_auth/session-${name}`
  const folderExists = await fs.stat(folder).then(() => true).catch(() => false)
  if (spawnedBots[name] || folderExists) {
    if (spawnedBots[name]) {
      spawnedBots[name].process.kill()
      delete spawnedBots[name]
    }
    if (folderExists) {
      await wait(2500)
      fs.rm(folder, { recursive: true, force: true }).catch(err => {
        if (err.code === 'ENOTEMPTY') {
          console.log(`Error while deleting folder ${folder}: ${err.message}`)
        } else {
          throw err
        }
      })
    }
    res.json({ message: `Bot ${name} deleted successfully` })
  } else {
    res.status(404).json({ message: `Bot ${name} not found` })
  }
})

// Route to get last logs for a spawned bot
app.get('/bots/:name/logs', async (req, res) => {
  const { name } = req.params
  const { stream } = req.query
  const isToStream = stream === 'true'
  if (spawnedBots[name]) {
    if (!isToStream) {
      return res.json(spawnedBots[name].logs)
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    spawnedBots[name].logs.forEach(log => {
      res.write(log)
    })

    spawnedBots[name].process.stdout.on('data', data => {
      res.write(data)
    })

    spawnedBots[name].process.stderr.on('data', data => {
      res.write(`\n\nERROR: ${data}\n\n`)
    })

    while (spawnedBots[name].process) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    res.end()
  } else {
    res.status(404).json({ message: `Bot ${name} not found` })
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
//
// ================================== Helper functions ==================================
//
/**
 * Spawns a new bot.
 *
 * This function spawns a new node process with the `spawn.js` file and the name and
 * params as arguments. It then stores the bot's process and an empty buffer for its
 * logs in the in-memory store.
 *
 * @param {string} name - The name of the bot.
 * @param {object} params - Object with the bot's parameters.
 * @returns {Promise<[Error, string, string]>} - A promise that resolves with an error
 * message, a message indicating that the bot was spawned successfully, and the QR code
 * if it was generated.
 */
async function spawnBot (name, params) {
  try {
    // Spawn a new node process with the spawn.js file and the name and params as arguments
    const botProcess = spawn('node', ['src/spawn.js', name, params])

    // Store the bot's process and an empty buffer for its logs in the in-memory store
    spawnedBots[name] = {
      name,
      process: botProcess,
      logs: []
    }

    // Set the maximum size of the logs buffer
    const maxLogs = 100
    const logsBuffer = Buffer.alloc(maxLogs * 1024)
    let logBufferIndex = 0

    // Listen to the bot's stdout and store its logs in the buffer
    botProcess.stdout.on('data', (data) => {
      // Copy the data to the buffer, if necessary shifting the buffer to make room
      const dataLength = data.length
      if (logBufferIndex + dataLength > maxLogs * 1024) {
        // shift the buffer by the amount of data we're about to write
        logsBuffer.copy(logsBuffer, 0, logBufferIndex, maxLogs * 1024)
        logBufferIndex = 0
      }
      data.copy(logsBuffer, logBufferIndex)
      logBufferIndex += dataLength
      // Prepend the name of the bot to the log and remove the trailing newline
      const trailingNewlineRegex = /\n$/
      const parsedLine = `[${name}] ${data.toString().replace(trailingNewlineRegex, '')}`
      console.log(parsedLine)

      // Store the log in the in-memory store
      if (spawnedBots[name]) {
        spawnedBots[name].logs.push(data.toString())
      }
    })

    // Wait until the "Client is ready!" or "QR code generated" message is received
    let qrcode = null
    await new Promise((resolve) => {
      botProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Client is ready!')) {
          resolve()
        }
        if (data.toString().includes('QR code received!')) {
          const line = data.toString()
          qrcode = line.split('QR code received! ')[1].replace('\n', '')
          resolve()
        }
      })
    })

    return [null, `Bot ${name} spawned successfully`, qrcode || undefined]
  } catch (error) {
    return [error, `Failed to spawn bot ${name}`]
  }
}

/**
 * Spawns all bots in the `.wwebjs_auth` folder.
 *
 * This function reads the contents of the `.wwebjs_auth` folder, and for each
 * bot that is not already spawned, it calls the `spawnBot` function to spawn it.
 *
 * @return {Promise<void>} A promise that resolves when all bots have been
 * spawned.
 */
async function automaticallySpawnBots () {
  try {
    const botsFolder = './.wwebjs_auth'
    const files = await fs.readdir(botsFolder)

    if (files.length === 0) {
      console.log('No bots to spawn.')
      return
    }

    console.log(`Spawning ${files.length} bots...`)
    for (const file of files) {
      const name = file.replace('session-', '')
      // If the bot is not already spawned...
      if (!spawnedBots[name]) {
        console.log(`Spawning bot ${name}...`)
        // Wait for 1 second to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 1000))
        // Spawn the bot
        spawnBot(name, {})
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No .wwebjs_auth folder found.')
    } else {
      console.error('Error while spawning bots:', error)
    }
  }
}
