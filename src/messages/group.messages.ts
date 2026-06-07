// 
// ===== Constants =====================================================================================================
// 

const casualPrefix =
  '{|{Pô|Poxa|Porra|Se liga|Uai} {véi|mano|bro|brother|bixo|bicho}{| kk}{||!|}\n\n}'

const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

const sentenceEnd =
  '{|.|!|!!|!!!| uai| kk}'

// 
// ===== Main export ==================================================================================================
// 
export const groupMessages = {
  // ── Config ────────────────────────────────────────────────────────────────

  configUnavailable:
    `${errorPrefix}⚙️ {Configuração de grupos indisponível|Não encontrei o serviço de configuração} neste runtime. {Deve ter saído pra almoço|Tenta de novo em breve}${sentenceEnd}`,

  groupOnly:
    `${casualPrefix}🏘️ {Este comando só funciona em grupos|Isso aqui é exclusivo de grupo}. {Conversa privada não conta|Aqui no {pv|privado|dm} não funciona}${sentenceEnd}`,

  configBotAdminRequired:
    `${casualPrefix}🔐 {Preciso ser admin do grupo|Me dá permissão de admin} para salvar a configuração na descrição. {Sem isso eu não consigo persistir nada|Sem permissão, sem config}${sentenceEnd}`,

  booleanOptionInvalid(keys: string): string {
    return `${casualPrefix}❓ {Opção inválida|Não reconheci essa opção}. As disponíveis são: ${keys}. {Escolhe uma da lista|Segue o cardápio}${sentenceEnd}`
  },

  stringOptionInvalid(keys: string): string {
    return `${casualPrefix}❓ {Campo inválido|Não reconheci esse campo}. Os disponíveis são: ${keys}. {Segue a lista.|Só tem esses mesmo.}${sentenceEnd}`
  },

  configSummary(enabled: string, disabled: string, textOptions: string): string {
    return `⚙️ *Configuração do grupo*\n\nAtivos: ${enabled}\nDesligados: ${disabled}\n${textOptions}\n\n{Exemplos:|Como usar:} \`!on welcome\`, \`!off welcome\`, \`!set pacote DeadByte.com.br\` ou \`!set autor bot de figurinhas\`.`
  },

  configUpdated:
    `✅ {Configuração atualizada|Salvei as configurações na descrição}. {Pronto|Tá valendo|Feito}${sentenceEnd}`,

  // ── Moderação — guards compartilhados ─────────────────────────────────────

  whatsappClientUnavailable:
    `${errorPrefix}📵 {Cliente do WhatsApp indisponível|Não consegui acessar o cliente do WhatsApp} agora. {Tenta em instantes|Algo no runtime não colaborou}${sentenceEnd}`,

  groupLoadFailed:
    `${errorPrefix}💾 {Não consegui carregar os dados do grupo|Falha ao carregar o grupo}. {Tenta de novo|Algo não respondeu como esperado}${sentenceEnd}`,

  senderAdminRequired:
    `${casualPrefix}🛡️ {Apenas admins podem usar este comando|Este comando é restrito a admins}. {Sem permissão, sem ação|Não depende de mim}${sentenceEnd}`,

  botAdminRequired:
    `${casualPrefix}🔐 {Preciso ser admin para executar esta ação|Me torna admin antes de pedir isso}. {Sem permissão eu não consigo fazer nada aqui|Hierarquia é hierarquia}${sentenceEnd}`,

  noTargets:
    `${casualPrefix}🎯 {Marca alguém|Responde uma mensagem|Informa o número com DDI} para eu saber o alvo. {Sem alvo não tem como continuar|Preciso saber quem é}${sentenceEnd}`,

  // ── Fechar / abrir grupo ──────────────────────────────────────────────────

  messagesAdminsOnlyUnavailable:
    `${errorPrefix}🚫 {Este runtime não suporta|Não tenho acesso a} bloqueio de mensagens para não-admins. {Limitação do ambiente|A API não disponibiliza isso aqui}${sentenceEnd}`,

  groupClosed:
    `🔒 {Grupo fechado|Fechei o grupo 🙃|Tá fechado 🔐|Calem a boca! 🤐|Calados! 🙊}\n\n{Agora só {admins|adms} podem {enviar mensagens|falar}}${sentenceEnd}`,

  groupOpened:
    `🔓 {Grupo aberto. De nada 🙃|Abri o grupo, podem comemorar 🎉|Ok, o grupo tá aberto de novo 😮‍💨}\n\n{Todos podem {enviar mensagens|falar|conversar}|Porteira liberada, não me decepcionem 😌|Tá liberado, mas eu tô de olho 👁️}${sentenceEnd}`,

  // ── Admins ────────────────────────────────────────────────────────────────

  adminChangeUnavailable:
    `${errorPrefix}🚫 {Este runtime não suporta|Não tenho acesso a} alteração de admins. {Limitação do ambiente|A API não deixa fazer isso aqui}${sentenceEnd}`,

  adminPromoted(targets: string): string {
    return `👑 {Tem adm novo na area|Admin concedido|Promovido a admin|Parabéns, novo admin|Mais um com o crachá de admin}: ${targets}{|.|!|!!|!!!}\n\n{Use bem esse poder, por favor 🙏|Espero que a responsabilidade venha junto 😌|Não me arrependa disso 👁️|Confio em você. Mais ou menos 😇}`
  },

  adminDemoted(targets: string): string {
    return `📛 {Admin removido|Rebaixado com todo carinho|O crachá foi recolhido|Voltou pra fila do povo}: ${targets}{|.|!|!!|!!!}\n\n{Foi bom enquanto durou 😌|Tudo tem seu tempo, né 😇|Decisões foram tomadas 😌|Não é pessoal. Bom, talvez um pouco 🤏}`
  },

  // ── Regras ────────────────────────────────────────────────────────────────

  noRules:
    '📋 {Este grupo não tem regras na descrição|Não encontrei regras na descrição}. {Nada registrado por enquanto.|Descrição vazia nessa parte.}',

  rules(rules: string): string {
    return `📋 *Regras do grupo*\n\n${rules}`
  },

  // ── Solicitações de entrada ───────────────────────────────────────────────

  membershipRequestsUnavailable:
    `${errorPrefix}🚫 {Este runtime não expõe|Não tenho acesso às} solicitações de entrada. {Limitação do ambiente|A API não disponibiliza isso aqui}${sentenceEnd}`,

  approveRequestsUnavailable:
    `${errorPrefix}🚫 {Este runtime não suporta|Não tenho acesso à} aprovação de solicitações. {Limitação do ambiente|A API não deixa fazer isso aqui}${sentenceEnd}`,

  rejectRequestsUnavailable:
    `${errorPrefix}🚫 {Este runtime não suporta|Não tenho acesso à} rejeição de solicitações. {Limitação do ambiente|A API não deixa fazer isso aqui}${sentenceEnd}`,

  noMembershipRequests:
    `✅ {Não há solicitações de entrada|A fila de entrada está vazia}. {Tudo tranquilo por aqui.|Ninguém esperando.}${sentenceEnd}`,

  approvedRequests(count: number): string {
    return `✅ {Aprovei|Liberei|Deixei entrar} ${count} solicitação(ões). {Pronto, podem vir 🙃|Portaria em dia 📋|Feito com todo amor 😌|Espero que valha a pena 🙏}`
  },

  rejectedRequests(count: number): string {
    return `🚫 {Rejeitei|Recusei|Dispensei} ${count} solicitação(ões). {Peneira passou 🫸|Feito.|Nem todo mundo entra, né 😌|Critérios foram aplicados 📋|A seleção natural fez seu trabalho 🙃}`
  },

  membershipRequestsPreview(count: number, preview: string): string {
    return `📋 {Tem|Há|Chegaram} ${count} solicitação(ões) esperando uma decisão sua 👀: ${preview}\n\nUse *solicitacoes aceitar* ou *solicitacoes rejeitar* pra resolver isso. {Eles tão esperando 🙃|Não deixa acumulando 😌}`
  },

  membershipRequestsCount(count: number): string {
    return `📋 {Tem|Há} ${count} solicitação(ões) de entrada acumulando na fila\n\nUse *solicitacoes aceitar* ou *solicitacoes rejeitar* quando {se animar|tiver coragem|puder} 🙃`
  },

  // ── Sorteio ───────────────────────────────────────────────────────────────

  noGiveawayAdmins:
    '🔍 {Não encontrei admins elegíveis|Sem admins para sortear, curioso isso 🤔|A lista de admins elegíveis veio vazia}. {Verifica se há admins no grupo 😌|Ninguém elegível no momento — coincidência, com certeza 🙃|Tá difícil achar alguém qualificado por aqui 😇}',

  noGiveawayParticipants:
    '🔍 {Não encontrei participantes elegíveis|Ninguém elegível para o sorteio — surpresa 🙃|Lista de participantes: vazia}. {Verifica os critérios 📋|Lista vazia, o que dizer 😌|Talvez os critérios sejam altos demais, ou as pessoas baixas demais 😇}',

  giveawayWinner(winner: string): string {
    return `🎉 ${winner} ganhou! 🎉\n\n{Parabéns, a sorte te escolheu 🍀|Foi você dessa vez 😌|O algoritmo decidiu — quem sou eu pra questionar 🙃|Aproveita, que sorte assim não é sempre 😇}`
  },

  giveawayPrizeWinner(winner: string, prize: string): string {
    return `🎉 ${winner} ganhou *${prize}*! 🎉\n\n{Parabéns, a sorte sabe o que faz 🍀|A sorte decidiu e eu respeito 😌|Tava escrito nas estrelas — ou no Math.random() kk|Que sorte ein?}`
  },

  giveawayReactions: ['🎉', '🥳', '✨'],

  // ── Roleta ────────────────────────────────────────────────────────────────

  participantRemovalUnavailable:
    '🚫 {Este runtime não suporta|Não tenho acesso à} remoção de participantes. {Limitação do ambiente, não é falta de vontade 😌|A API não deixa fazer isso aqui 🙃|Tecnicamente impossível, infelizmente 😇}',

  noRouletteCandidate:
    '🎯 {Não encontrei participante elegível|Sem alvo para a roleta 🫠|A roleta ficou sem vítima}. {Sem participantes comuns no grupo — que conveniente 🙃|Ninguém elegível no momento, salvos por ora 😌|Grupo blindado aparentemente 😇}',

  rouletteLoser(target: string): string {
    return `🎰 {Roleta:|Resultado da roleta:|A sorte falou:} ${target} perdeu. {Pura estatística, juro 😇|Não foi pessoal — foi matemática 🙃|O algoritmo decidiu, eu só executei 😌|Que pena. Ou não. 😌}`
  },

  // ── Apagar mensagens ──────────────────────────────────────────────────────

  deleteReplyRequired:
    '📌 {Responde a mensagem que devo apagar|Usa reply na mensagem alvo, por favor}. {Sem isso não sei qual apagar — não sou adivinho 🙃|Preciso da referência, senão apago a errada e aí é culpa minha 😌}',

  deletedMessages(count: number): string {
    return `🧹 {Pronto|Feito.|Limpeza concluída ✨} Apaguei ${count} mensagem(ns){, incluindo replies recentes quando possível|}. {Tá limpo 😌|Que bom ar fresco 🌬️|Como se nunca tivesse existido 🙃}`
  },

  // ── Remover / adicionar participantes ─────────────────────────────────────

  participantAddUnavailable:
    '🚫 {Este runtime não suporta|Não tenho acesso à} adição de participantes. {Limitação do ambiente, não pergunta por quê 😌|A API não deixa fazer isso aqui 🙃|Queria ajudar, mas as circunstâncias não cooperam 😇}',

  removedParticipants(targets: string): string {
    return `👋 {Removido(s) com sucesso|Saíram da conversa|Dispensado(s)}: ${targets}. {Tchau 😌|Foi um prazer — pra alguém 🙃|A porteira fechou atrás 😇}`
  },

  addAttempted(targets: string): string {
    return `📨 {Tentei adicionar|Convite enviado para}: ${targets}. {Depende do WhatsApp aceitar — agora é com eles 🙃|Fiz minha parte, o resto é com o universo 😌|Bola tá no campo deles agora 🏐}`
  },

  // ── Chamar admins / todos ─────────────────────────────────────────────────

  noAdmins:
    '🔍 {Não encontrei admins no grupo|A lista de admins veio vazia — interessante}. {Ninguém com permissão no momento, boa sorte 🙃|Verifica o grupo, porque assim não dá 😌|Grupo selvagem, sem liderança aparente 😇}',

  callAdminsDefault:
    '📢 {Chamando admins|Atenção, admins — alguém lembra que vocês existem?}. {Alguém precisou de vocês, apareçam 🙃|Dá uma olhada aqui quando puder, sem pressa 😌|O grupo chamou. Atendam, por favor 😇}',

  noParticipantsToMention:
    '🔍 {Não encontrei participantes para marcar|Lista de participantes vazia — curioso}. {Sem ninguém para notificar, gritei no vazio 🙃|Grupo vazio? Ou invisíveis? 😌|Mandei o aviso pro nada 😇}',

  everyoneDefault:
    '📢 {Atenção ☝️|Ei, pessoal|@todos}. {Alguém pediu para avisar todo mundo — aqui estou 🙃|Chamado geral, apareçam 😌|Presenças, por favor 😇}',
}