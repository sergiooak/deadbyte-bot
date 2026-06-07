// 
// ===== Constants =====================================================================================================
// 

const errorPrefix =
  '{|{Opa|Oops|Eita|Putz|Vixe|Vish|Uai|Porra{| caralho}|Caralho}{!|!!|!!!} }'

// 
// ===== Main export ==================================================================================================
// 

export const middlewareMessages = {
  commandFailed:
    `${errorPrefix}💥 {Deu ruim|Tropecei bonito|Algo quebrou} ao executar {o comando|essa função}. {Tenta novamente daqui a pouco 🙏|Pode tentar de novo, com otimismo 🙃|Se persistir, finja surpresa 😇|Não foi eu, foi o sistema 😌}`,

  commandDisabled:
    '🚫 {Esse comando|Essa função} {está|tá} desativado{ por aqui| nessa instância}. {Nada pessoal, só configuração mandando mais que eu 😌|Reclama com quem mexeu no painel 🙃|Alguém lá em cima decidiu que não 😇|Ativado? Nunca ouvi falar}',

  ownerOnly:
    '👑 {Esse comando|Essa função} é {restrito|reservado} ao dono da instância. {Foi mal, crachá insuficiente 🪪|Hoje não, pequeno gafanhoto 🙃|Nível de acesso incompatível com a ambição 😌|Admiro a coragem, mas não rola 😇}',
}