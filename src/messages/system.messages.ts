export const systemMenuGroupLabels = {
  system: '{🔧 Sistema|🔧 Sistema, o painel que ninguém lê até quebrar}',
  sticker: '{🎨 Figurinhas|🎨 Figurinhas, a fábrica de caos visual}',
  fun: '{😄 Diversão|😄 Diversão, porque alguém precisa trabalhar pouco}',
  group: '{👥 Grupo|👥 Grupo, administração com leve julgamento}'
}

export const systemMessages = {
  ping: '🏓 - Pong{|!|!!|!!!}{| kk} {|\n{Tô|To} {vivo|funcionando|respondendo}{|.|!|!!|!!!}{| (por enquanto{| kk})}}',
  status(instanceId: string, mode: string, uptime: string, clientId: string): string {
    return `{🤖|⚙️|📡} *{Status da instância|Status do bot|Diagnóstico básico, já que pediram}*\n\ninstance: ${instanceId}\nmode: ${mode}\nuptime: ${uptime}\nclient: ${clientId}`
  },
  timeLookupFailed:
    '{Erro|Falhei|Não consegui} ao buscar a hora. {Tenta novamente|Pode tentar de novo daqui a pouco|A geografia temporal tropeçou aqui}.',
  timeNotFound(query: string): string {
    return `{Não encontrei|Procurei e nada de achar} a localização *${query}*. Tenta com {outro nome|uma cidade, estado ou país diferente|um nome menos misterioso, por gentileza}.`
  },
  timeResult(clock: string, formattedTime: string, shortName: string, gmtLabel: string): string {
    return `${clock} *${formattedTime}*\n\n{📍|🗺️} ${shortName}\n{🌐|🕒} ${gmtLabel}\n\n{Tá na mão|Pronto, consulta temporal feita|Aparentemente o relógio ainda funciona}.`
  },
  timeResultWithDifference(clock: string, formattedTime: string, shortName: string, gmtLabel: string, timeDifference: string): string {
    return `${clock} *${formattedTime}*\n\n{📍|🗺️} ${shortName}\n{🌐|🕒} ${gmtLabel}\n{⏱️|⌚} ${timeDifference}\n\n{Tá na mão|Pronto, consulta temporal feita|Aparentemente o relógio ainda funciona}.`
  },
  menuHeader:
    '{🤖|📋|🧭} *DeadByte — {Menu de Comandos|Comandos disponíveis|Ajuda, porque adivinhar comando é chato}*',
  menuUnknownGroup(group: string): string {
    return `{📦 ${group}|📦 ${group}, seja lá quem batizou isso}`
  },
  menuAliasHint(aliases: string): string {
    return ` _({ou|também|se quiser variar} ${aliases})_`
  },
  menuCommandLine(primary: string, aliasHint: string, description: string): string {
    return `• *${primary}*${aliasHint} — ${description}`
  },
  menuFooter:
    '{Use com moderação|Pronto, agora não tem desculpa|Se der errado, pelo menos o menu estava aqui}.'
}
