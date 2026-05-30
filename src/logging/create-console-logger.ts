import { createConsola } from 'consola'

export function createConsoleLogger() {
  return createConsola({
    stdout: process.stderr,
    stderr: process.stderr
  }).withTag('deadbyte-bot')
}
