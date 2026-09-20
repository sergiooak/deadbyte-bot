import { defineCommand } from '@deadbyte/runtime'
import { fetchTexasCep } from '../../services/texas/texas-api.service.js'
import { matchesExplicitAlias } from '../../utils/commands.js'

export const cepCommand = defineCommand({
  id: 'utility.cep',
  group: 'utility',
  name: 'Consulta de CEP',
  description: 'Busca endereço a partir de um CEP.',
  aliases: ['cep', 'endereco', 'endereço', 'buscarcep', 'consultacep', 'postal', 'zipcode'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesExplicitAlias(ctx, 'utility.cep', cepCommand.aliases)
  },
  async run(ctx) {
    const cep = ctx.parsedCommand?.argsText?.trim().replace(/\D/g, '')
    if (!cep || cep.length !== 8) {
      await ctx.reply('Informe um CEP válido com 8 dígitos.\nEx: *!cep 01001000*')
      return
    }

    try {
      const r = await fetchTexasCep(cep)
      const lines = [
        `📍 *CEP:* ${r.cep}`,
        `🏙️ *Cidade:* ${r.city} - ${r.state}`,
        r.neighborhood ? `🏘️ *Bairro:* ${r.neighborhood}` : null,
        r.street ? `🛣️ *Logradouro:* ${r.street}` : null,
      ].filter(Boolean).join('\n')
      await ctx.reply(lines)
    } catch {
      await ctx.reply('Não foi possível encontrar o CEP informado. Verifique e tente novamente.')
    }
  }
})
