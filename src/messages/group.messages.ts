export const groupMessages = {
  configUnavailable:
    '{Configuração de grupos indisponível|Não achei o serviço de configuração de grupos} neste runtime. {Hoje o painel veio sem botão|A infraestrutura resolveu ser minimalista}.',
  groupOnly:
    '{Este comando só funciona em grupos|Isso aqui é coisa de grupo, não de conversa solo}. {Burocracia básica|Regras são regras, infelizmente}.',
  configBotAdminRequired:
    '{Preciso ser admin do grupo|Me dá admin primeiro} para atualizar a descrição e salvar a configuração. {Sem cargo eu sou só palpiteiro|Sem crachá, sem milagre}.',
  configUpdated:
    '{Configuração do grupo atualizada|Salvei a configuração na descrição}. {Pronto, pode fingir que foi fácil|A ata da bagunça está em dia}.',
  booleanOptionInvalid(keys: string): string {
    return `{Opção booleana inválida|Essa opção liga/desliga não existe}. Use: ${keys}. {Sim, tem lista por um motivo|Escolhe uma dessas, ajuda o bot}.`
  },
  stringOptionInvalid(keys: string): string {
    return `{Opção textual inválida|Esse campo de texto não existe}. Use: ${keys}. {Criatividade é linda, mas config tem limite|Vamos seguir o cardápio}.`
  },
  configSummary(enabled: string, disabled: string, textOptions: string): string {
    return `*{Configuração do grupo|Raio-X da configuração do grupo}*\n\nAtivos: ${enabled}\nDesligados: ${disabled}\n${textOptions}\n\n{Use|Exemplo, já que config não é adivinhação}: !on welcome, !off welcome, !set autor Sergio ou !set pacote DeadByte.`
  },
  whatsappClientUnavailable:
    '{Cliente do WhatsApp indisponível|O WhatsApp sumiu deste runtime} agora. {Difícil moderar grupo por telepatia|Sem cliente, sem show}.',
  senderAdminRequired:
    '{Apenas admins do grupo podem usar este comando|Esse botão é para admin, meu nobre}. {Sem martelinho, sem julgamento|A democracia acabou nesta função}.',
  botAdminRequired:
    '{Preciso ser admin do grupo para executar esta ação|Me torna admin antes de pedir milagre}. {Sem permissão eu só passo vergonha|O bot também tem limite hierárquico}.',
  groupLoadFailed:
    '{Não consegui carregar os dados do grupo|O grupo não quis abrir os dados pra mim}. {Muito maduro da parte dele|Tenta de novo, vai que ele colabora}.',
  noTargets:
    '{Marca alguém|Responde uma mensagem|Informa o número com DDI} para eu saber quem é o alvo. {Adivinhação está em manutenção|Sem alvo eu vou bater em vento}.',
  messagesAdminsOnlyUnavailable:
    '{Este runtime não expõe|Não tenho acesso a} alteração de mensagens apenas para admins. {O botão existe em outro universo|A API guardou essa chave no cofre}.',
  groupClosed:
    '{Grupo fechado|Fechei o grupo}. Agora apenas admins podem enviar mensagens. {Silêncio administrativo instalado|A paz foi terceirizada para os admins}.',
  groupOpened:
    '{Grupo aberto|Abri o grupo}. Todos podem enviar mensagens. {Boa sorte para quem vai moderar isso|A porteira voltou a existir}.',
  adminChangeUnavailable:
    '{Este runtime não expõe|Não tenho acesso a} alteração de admins do grupo. {Sem o botão, sem o teatro|A API não deixou brincar de RH}.',
  adminPromoted(targets: string): string {
    return `{Admin concedido|Subiu de cargo, olha só}: ${targets}`
  },
  adminDemoted(targets: string): string {
    return `{Admin removido|Desceu do trono}: ${targets}`
  },
  noRules:
    '{Este grupo ainda não tem regras na descrição|Não achei regras na descrição do grupo}. {Coragem viver assim|A anarquia está documentada pela ausência}.',
  rules(rules: string): string {
    return `*{Regras do grupo|Manual de sobrevivência do grupo}*\n\n${rules}`
  },
  membershipRequestsUnavailable:
    '{Este runtime não expõe|Não tenho acesso às} solicitações de entrada do grupo. {A portaria está sem janela|A API fechou a recepção}.',
  noMembershipRequests:
    '{Não há solicitações de entrada no grupo|A fila de entrada está vazia}. {Milagre administrativo|Ninguém pedindo pra entrar, que paz suspeita}.',
  approveRequestsUnavailable:
    '{Este runtime não expõe|Não tenho acesso à} aprovação de solicitações. {A caneta de aprovado sumiu|A portaria me ignorou}.',
  rejectRequestsUnavailable:
    '{Este runtime não expõe|Não tenho acesso à} rejeição de solicitações. {Nem para negar me deram botão|A portaria está seletiva}.',
  approvedRequests(count: number): string {
    return `{Aprovei|Liberei} ${count} solicitação(ões) de entrada. {Portaria trabalhando|Todo mundo pra dentro, que Deus ajude os admins}.`
  },
  rejectedRequests(count: number): string {
    return `{Rejeitei|Barrei} ${count} solicitação(ões) de entrada. {Portaria sem dó|Hoje a peneira veio fina}.`
  },
  membershipRequestsPreview(count: number, preview: string): string {
    return `{Há|Tem} ${count} solicitação(ões) de entrada: ${preview}\n\nUse *solicitacoes aceitar* ou *solicitacoes rejeitar*, {sem drama|com carinho administrativo}.`
  },
  membershipRequestsCount(count: number): string {
    return `{Há|Tem} ${count} solicitação(ões) de entrada.\n\nUse *solicitacoes aceitar* ou *solicitacoes rejeitar*, {porque a fila não anda sozinha|por incrível que pareça}.`
  },
  noGiveawayAdmins:
    '{Não encontrei admins para sortear|Sem admins elegíveis pro sorteio}. {Ou esconderam bem|Ou o organograma está triste}.',
  noGiveawayParticipants:
    '{Não encontrei participantes para sortear|Não achei ninguém elegível pro sorteio}. {Sorteio com plateia invisível é complicado|A lista veio mais vazia que reunião sexta à tarde}.',
  giveawayWinner(winner: string): string {
    return `${winner} {parabéns|olha só, ganhou}! Você ganhou o sorteio! {Favor fingir surpresa|A sorte trabalhou por você hoje}.`
  },
  giveawayPrizeWinner(winner: string, prize: string): string {
    return `${winner} {parabéns|olha só, ganhou}! Você ganhou o sorteio de *${prize}*! {Favor fingir surpresa|A aleatoriedade decidiu e eu só obedeço}.`
  },
  noRouletteCandidate:
    '{Não encontrei participante comum para a roleta|Sem alvo elegível para a roleta}. {Os admins escaparam por burocracia|A roleta girou no vazio}.',
  participantRemovalUnavailable:
    '{Este runtime não expõe|Não tenho acesso à} remoção de participantes. {Sem martelo, sem ban|A API tirou meu chinelo}.',
  rouletteLoser(target: string): string {
    return `{Roleta russa|A roleta girou}: ${target} perdeu. {Foi estatística, não pessoal|A matemática foi cruel hoje}.`
  },
  deleteReplyRequired:
    '{Responde a mensagem que devo apagar|Marca a mensagem respondendo ela, por favor}. {Apagar por intuição ainda não chegou|Sem reply eu não sei qual foi a obra-prima}.',
  deletedMessages(count: number): string {
    return `{Pronto|Feito}. Apaguei ${count} mensagem(ns), incluindo replies recentes quando foi possível. {Limpeza concluída|A vassoura digital passou}.`
  },
  removedParticipants(targets: string): string {
    return `{Removido(s)|Tirei da sala}: ${targets}. {Porta fechada com sucesso|O grupo ficou alguns bytes mais leve}.`
  },
  participantAddUnavailable:
    '{Este runtime não expõe|Não tenho acesso à} adição de participantes. {Sem convite, sem festa|A API trancou a porta}.',
  addAttempted(targets: string): string {
    return `{Tentei adicionar|Mandei o convite para}: ${targets}. {Se o WhatsApp deixar, ótimo|Agora é com a burocracia do zap}.`
  },
  noAdmins:
    '{Não encontrei admins na lista de participantes|A lista de admins veio vazia}. {Ou estão invisíveis|Ou a hierarquia foi de férias}.',
  callAdminsDefault:
    '{Chamando admins|Admins, apareçam}. {A reunião que ninguém pediu começou|Favor fingir disponibilidade}.',
  noParticipantsToMention:
    '{Não encontrei participantes para marcar|A lista de participantes veio vazia}. {Marcar o vazio é poesia, mas não resolve|Sem gente, sem @}.',
  everyoneDefault:
    '{@todos|Atenção, turma|Todo mundo olhando aqui}. {Chamado geral, porque aparentemente precisava|Notificação coletiva com carinho questionável}.',
  giveawayReactions: ['🎉', '🥳', '✨']
}
