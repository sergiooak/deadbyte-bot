import { defineCommand } from '@deadbyte/runtime'
import { funMessages } from '../../messages/fun.messages.js'
import { matchesCommandAlias } from '../../utils/commands.js'

const MAX_COINS = 100
const NAMED_ALIASES = ['moeda', 'caraoucoroa', 'cara-coroa', 'coin']

function parseCoinCount(argsText: string): number {
  const rawCount = argsText.trim().split(/\s+/)[0] ?? ''
  const parsed = Number.parseInt(rawCount, 10)

  if (!Number.isFinite(parsed)) return 1

  return Math.min(Math.max(parsed, 1), MAX_COINS)
}

function flipCoin(): 'cara' | 'coroa' {
  return Math.random() < 0.5 ? 'cara' : 'coroa'
}

function formatCoinDetails(flips: Array<'cara' | 'coroa'>): string {
  return flips.map((result, index) => `• ${index + 1}º: *${result}*`).join('\n')
}

export const coinCommand = defineCommand({
  id: 'fun.coin',
  group: 'fun',
  name: 'Cara ou Coroa',
  description: 'Joga uma ou mais moedas. Ex: !moeda, !moeda 5',
  aliases: NAMED_ALIASES,
  enabledByDefault: true,
  ownerOnlyByDefault: false,
  order: 1,
  supports: {
    private: true,
    groups: true,
    implicit: false
  },
  configFields: [],
  async match(ctx) {
    return matchesCommandAlias(ctx, 'fun.coin', coinCommand.aliases)
  },
  async run(ctx) {
    const argsText = ctx.parsedCommand?.argsText ?? ''
    const coinCount = parseCoinCount(argsText)
    const flips = Array.from({ length: coinCount }, () => flipCoin())
    const heads = flips.filter((result) => result === 'cara').length
    const tails = coinCount - heads

    if (coinCount === 1) {
      await ctx.reply(funMessages.coinSingle(flips[0]))
      return
    }

    await ctx.reply(funMessages.coinMany(coinCount, heads, tails, formatCoinDetails(flips)))
  }
})
