/**
 * Statistics Bot Commands
 * @param {import('../../types.d.ts').WWebJSMessage} msg
 * @returns {Object}
 */
export default (msg) => {
  return {
    stats: /^(stats|estatisticas|estatistica|statistics|stat)$/.test(msg.aux.function),
    botStats: /^(bstats|botstats|estatisticasbot|botstatistics|bstat)$/.test(msg.aux.function),
    weekStats: /^(wstats|weekstats|estatisticassemana|weekstatistics|wstat)$/.test(msg.aux.function),
    dayStats: /^(dstats|daystats|estatisticasdia|daystatistics|dstat)$/.test(msg.aux.function),
    hourStats: /^(hstats|hourstats|estatisticashora|hourstatistics|hstat)$/.test(msg.aux.function)
  }
}
