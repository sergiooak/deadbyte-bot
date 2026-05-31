import { readFile } from 'node:fs/promises'
import type { DeadByteConfig, RuntimeMode } from '@deadbyte/runtime'
import { resolveDeadByteConfig } from '@deadbyte/runtime'
import { loadConfig } from 'c12'
import { destr } from 'destr'
import { defu } from 'defu'
import { BotConfigSchema } from './bot-config.schema.js'
import { readBotEnv } from '../utils/env.js'

export type BotCliConfigOverrides = {
  mode?: RuntimeMode
  instanceId?: string
  clientId?: string
  sessionPath?: string
  runtimeConfig?: string
  internalApi?: boolean | string
  internalHost?: string
  internalPort?: number
  showBrowser?: boolean
  headless?: boolean | string
}

function coerceBoolean(v: boolean | string | undefined): boolean | undefined {
  if (v == null) return undefined
  if (typeof v === 'boolean') return v
  return v === 'true'
}

async function loadRuntimeConfigFile(path?: string): Promise<DeadByteConfig> {
  if (!path) {
    return {}
  }

  const raw = await readFile(path, 'utf8')
  const parsed = destr<unknown>(raw)
  return BotConfigSchema.parse(parsed)
}

export async function loadBotConfig(overrides: BotCliConfigOverrides = {}) {
  const env = readBotEnv()
  const c12Result = await loadConfig<DeadByteConfig>({
    name: 'deadbyte',
    cwd: process.cwd(),
    dotenv: true
  })

  const runtimeConfigPath = overrides.runtimeConfig || env.DEADBYTE_RUNTIME_CONFIG
  const fileConfig = await loadRuntimeConfigFile(runtimeConfigPath)

  const envConfig: DeadByteConfig = {
    mode: env.DEADBYTE_MODE,
    instanceId: env.DEADBYTE_INSTANCE_ID,
    clientId: env.DEADBYTE_CLIENT_ID,
    sessionPath: env.DEADBYTE_SESSION_PATH,
    whatsapp: {
      clientId: env.DEADBYTE_CLIENT_ID,
      sessionPath: env.DEADBYTE_SESSION_PATH,
      headless: env.DEADBYTE_HEADLESS,
      chromePath: env.DEADBYTE_CHROME_PATH || undefined
    },
    internalApi: {
      enabled: env.DEADBYTE_INTERNAL_API_ENABLED,
      host: env.DEADBYTE_INTERNAL_API_HOST,
      port: env.DEADBYTE_INTERNAL_API_PORT
    }
  }

  const cliConfig: DeadByteConfig = {
    mode: overrides.mode,
    instanceId: overrides.instanceId,
    clientId: overrides.clientId,
    sessionPath: overrides.sessionPath,
    whatsapp: {
      clientId: overrides.clientId,
      sessionPath: overrides.sessionPath,
      headless: overrides.showBrowser ? false : coerceBoolean(overrides.headless),
      chromePath: env.DEADBYTE_CHROME_PATH || undefined
    },
    internalApi: {
      enabled: coerceBoolean(overrides.internalApi),
      host: overrides.internalHost,
      port: overrides.internalPort
    }
  }

  const merged = defu(cliConfig, fileConfig, envConfig, c12Result.config ?? {})
  return resolveDeadByteConfig(merged)
}
