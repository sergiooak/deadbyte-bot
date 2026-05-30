import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DEADBYTE_MODE: z.enum(['standalone', 'managed']).optional(),
  DEADBYTE_INSTANCE_ID: z.string().optional(),
  DEADBYTE_CLIENT_ID: z.string().optional(),
  DEADBYTE_SESSION_PATH: z.string().optional(),
  DEADBYTE_HEADLESS: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  DEADBYTE_CHROME_PATH: z.string().optional(),
  DEADBYTE_INTERNAL_API_ENABLED: z
    .string()
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  DEADBYTE_INTERNAL_API_HOST: z.string().optional(),
  DEADBYTE_INTERNAL_API_PORT: z.coerce.number().int().positive().optional(),
  DEADBYTE_RUNTIME_CONFIG: z.string().optional(),
  FFMPEG_PATH: z.string().optional(),
  FFPROBE_PATH: z.string().optional()
})

export type BotEnv = z.infer<typeof EnvSchema>

export function readBotEnv(env: NodeJS.ProcessEnv = process.env): BotEnv {
  return EnvSchema.parse(env)
}
