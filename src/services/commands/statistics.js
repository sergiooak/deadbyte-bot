/**
 * Statistics Bot Commands
 * @param {import('whatsapp-web.js').Message} msg
 * @param {object} aux
 * @returns {Object}
 */
export default (msg, aux) => {
  return {
    stats: /^(stats|estatisticas|estatistica|statistics|stat)$/.test(aux.function),
    botStats: /^(bstats|botstats|estatisticasbot|botstatistics|bstat)$/.test(aux.function),
    weekStats: /^(wstats|weekstats|estatisticassemana|weekstatistics|wstat)$/.test(aux.function),
    dayStats: /^(dstats|daystats|estatisticasdia|daystatistics|dstat)$/.test(aux.function),
    hourStats: /^(hstats|hourstats|estatisticashora|hourstatistics|hstat)$/.test(aux.function)
  }
}
