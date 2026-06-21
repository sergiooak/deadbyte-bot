import { defineCommand } from '@deadbyte/runtime'
import { bibleMessages } from '../../messages/bible.messages.js'
import { fetchBibleSearchWord, fetchBibleSearchWordAll } from '../../services/texas/texas-api.service.js'
import { matchesCommandAlias } from '../../utils/commands.js'

export const searchBibleCommand = defineCommand({
  id: 'bible.search',
  group: 'bible',
  name: 'Pesquisar palavra',
  description: 'Busca versículos que contenham uma palavra na Bíblia. Ex: !buscarbiblia amor',
  aliases: ['buscarbiblia', 'bibliabucar', 'bb'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 5,
  supports: {
    private: true,
    groups: true,
    implicit: false,
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'bible.search', searchBibleCommand.aliases)
  },
  async run(ctx) {
    const palavra = ctx.parsedCommand?.argsText?.trim()
    if (!palavra) {
      await ctx.reply(bibleMessages.usageSearch)
      return
    }

    try {
      const result = await fetchBibleSearchWord(palavra)
      if (!result.status) {
        await ctx.reply(`📖 Nenhum resultado encontrado para *"${palavra}"* na Bíblia.`)
        return
      }
      await ctx.reply(bibleMessages.searchResult(result.nome, result.capitulo, result.versiculo!, result.escrita as string))
    } catch {
      await ctx.reply(bibleMessages.fetchError)
    }
  },
})

export const searchBibleAllCommand = defineCommand({
  id: 'bible.search-all',
  group: 'bible',
  name: 'Pesquisar palavra (todos)',
  description: 'Lista todas as ocorrências de uma palavra na Bíblia. Ex: !buscarbibliatodos amor',
  aliases: ['buscarbibliatodos', 'bbt'],
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 6,
  supports: {
    private: true,
    groups: true,
    implicit: false,
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'bible.search-all', searchBibleAllCommand.aliases)
  },
  async run(ctx) {
    const palavra = ctx.parsedCommand?.argsText?.trim()
    if (!palavra) {
      await ctx.reply(bibleMessages.usageSearch)
      return
    }

    try {
      const results = await fetchBibleSearchWordAll(palavra)
      if (!results.length) {
        await ctx.reply(`📖 Nenhum resultado encontrado para *"${palavra}"* na Bíblia.`)
        return
      }
      await ctx.reply(bibleMessages.searchAllResults(palavra, results))
    } catch {
      await ctx.reply(bibleMessages.fetchError)
    }
  },
})
