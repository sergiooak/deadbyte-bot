import express from 'express'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'

const app = express()
const port = 3000
app.use(express.json()) // for parsing application/json

// In-memory store for spawned bots
const spawnedBots = {}

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
app.post('/bots', (req, res) => {
  // dafaults name to a random string
  const { name = `${Math.random().toString(36).substring(7)}`, params } = req.body

  if (spawnedBots[name]) {
    res.status(409).json({ message: `Bot ${name} already exists` })
    return
  }
  const defaults = { /* add default params here */ }
  const botParams = { ...defaults, ...params }
  const botProcess = spawn('node', ['src/spawn.js', name, botParams])
  spawnedBots[name] = {
    name,
    process: botProcess,
    logs: []
  }
  spawnedBots[name].process.stdout.on('data', (data) => {
    console.log(`[${name}]${data}`)
    spawnedBots[name].logs.push(data.toString())
    if (spawnedBots[name].logs.length > 100) {
      spawnedBots[name].logs.shift() // remove first element
    }
  })
  res.json({ message: `Bot ${name} spawned successfully` })
})

// Route to delete a spawned bot
app.delete('/bots/:name', (req, res) => {
  const { name } = req.params
  if (spawnedBots[name]) {
    spawnedBots[name].kill()
    delete spawnedBots[name]
    res.json({ message: `Bot ${name} deleted successfully` })
  } else {
    res.status(404).json({ message: `Bot ${name} not found` })
  }
})

// Route to get last logs for a spawned bot
app.get('/bots/:name/logs', (req, res) => {
  const { name } = req.params
  if (spawnedBots[name]) {
    const logsBuffer = spawnedBots[name].logs
    res.json({
      logs: logsBuffer
    })
  } else {
    res.status(404).json({ message: `Bot ${name} not found` })
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
