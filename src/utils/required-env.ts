import { createError } from 'evlog'

/**
 * Lê uma chave obrigatória do ambiente. Se faltar, lança um erro estruturado (evlog) que explica
 * o motivo e a correção: ele aparece assim no log do bot e no painel.
 */
export function requireEnv(name: string, feature: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw createError({
      message: `${name} não está definida`,
      status: 500,
      why: `${feature} precisa dessa chave e o processo do bot não a recebeu.`,
      fix: `Defina ${name} nas variáveis de ambiente do spawner (Coolify > Environment Variables) e reinicie a instância. Em modo standalone, coloque no .env do bot.`
    })
  }
  return value
}
