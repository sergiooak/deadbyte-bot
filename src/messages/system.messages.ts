// 
// ===== Constants =====================================================================================================
// 

const casualPrefix =
  '{|{Pô|Poxa|Porra|Se liga|Uai} {véi|mano|bro|brother|bixo|bicho}{| kk}{||!|}\n\n}'

const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

// 
// ===== Main export ==================================================================================================
// 

export const systemMessages = {
  // ── Sistema ────────────────────────────────────────────────────────────────

  ping: '🏓 Pong{|!|!!}{| kk} {|\n{Tô|To} {vivo|funcionando|respondendo}{|, por enquanto 😌|, surpreendentemente|, não me agradeça}{| kk}}',

  status(instanceId: string, mode: string, uptime: string, clientId: string): string {
    return `{🤖|⚙️|📡} *{Status da instância|Diagnóstico|Status do bot}*\n\ninstance: ${instanceId}\nmode: ${mode}\nuptime: ${uptime}\nclient: ${clientId}\n\n{Tá de pé 😌|Operacional, aparentemente|Funcionando melhor do que o esperado 🙃}`
  },

  // ── Hora ───────────────────────────────────────────────────────────────────

  timeLookupFailed:
    `${errorPrefix}⏱️ {Falha ao buscar|Deu ruim ao consultar|Não consegui buscar} a hora. {Tenta novamente 🙏|O fuso me abandonou, tenta de novo 🙃|A geografia temporal tropeçou 😌}`,

  timeNotFound(query: string): string {
    return `${casualPrefix}🗺️ {Não encontrei|Procurei e nada} a localização *${query}*. {Tenta com outro nome 🙃|Essa aqui não existe no meu mapa 😌|Um nome menos misterioso ajudaria 😇}`
  },

  timeResult(clock: string, formattedTime: string, shortName: string, gmtLabel: string): string {
    return `${clock} *${formattedTime}*\n\n{📍|🗺️} ${shortName}\n{🌐|🕒} ${gmtLabel}\n\n{Tá na mão 😌|Consulta temporal concluída 🙃|O relógio ainda funciona ✨}`
  },

  timeResultWithDifference(clock: string, formattedTime: string, shortName: string, gmtLabel: string, timeDifference: string): string {
    return `${clock} *${formattedTime}*\n\n{📍|🗺️} ${shortName}\n{🌐|🕒} ${gmtLabel}\n{⏱️|⌚} ${timeDifference}\n\n{Tá na mão 😌|Consulta temporal feita com carinho 🙃|O tempo foi localizado ✨}`
  },

  // ── Menu ───────────────────────────────────────────────────────────────────

  menuHeader: '*DeadByte — Comandos*',

  menuAliasHint(aliases: string): string {
    return ` _(ou: ${aliases})_`
  },

  menuCommandLine(primary: string, aliasHint: string, description: string): string {
    return `• *${primary}*${aliasHint} — ${description}`
  },
}