/**
 * Lista das maiores cidades do Brasil por população (IBGE 2022),
 * usada para ordenar cidades retornadas pelo comando !ddd por relevância.
 * Nomes em Title Case, como retornados após normalização da API.
 */
const CITY_POPULATION_RANK: string[] = [
  'São Paulo',
  'Rio de Janeiro',
  'Brasília',
  'Salvador',
  'Fortaleza',
  'Belo Horizonte',
  'Manaus',
  'Curitiba',
  'Recife',
  'Porto Alegre',
  'Goiânia',
  'Belém',
  'Guarulhos',
  'Campinas',
  'São Luís',
  'Maceió',
  'Natal',
  'Teresina',
  'Campo Grande',
  'João Pessoa',
  'Santo André',
  'Osasco',
  'Jaboatão dos Guararapes',
  'São Bernardo do Campo',
  'Ribeirão Preto',
  'Uberlândia',
  'Sorocaba',
  'Contagem',
  'Aracaju',
  'Feira de Santana',
  'Cuiabá',
  'Joinville',
  'Juiz de Fora',
  'Londrina',
  'Porto Velho',
  'Serra',
  'Aparecida de Goiânia',
  'Ananindeua',
  'São José dos Campos',
  'Florianópolis',
  'Santos',
  'Mogi das Cruzes',
  'Diadema',
  'Betim',
  'Niterói',
  'Campina Grande',
  'Vila Velha',
  'Caxias do Sul',
  'Macapá',
  'Boa Vista',
  'Duque de Caxias',
  'São João de Meriti',
  'Carapicuíba',
  'Olinda',
  'Guarujá',
  'Belford Roxo',
  'Canoas',
  'São José do Rio Preto',
  'Mauá',
  'Paulista',
  'Pelotas',
  'Itaquaquecetuba',
  'Montes Claros',
  'Caruaru',
  'Campos dos Goytacazes',
  'Anápolis',
  'Cariacica',
  'Piracicaba',
  'Caucaia',
  'São Gonçalo',
  'Maringá',
  'Suzano',
  'Juazeiro do Norte',
  'Imperatriz',
  'Bauru',
  'Franca',
  'Jundiaí',
  'Petrópolis',
  'Gravataí',
  'Vitória',
  'Foz do Iguaçu',
  'Blumenau',
  'Cascavel',
  'Ribeirão das Neves',
  'Novo Hamburgo',
  'São Leopoldo',
  'Camaçari',
  'Vitória da Conquista',
  'Santarém',
  'Mogi Guaçu',
  'Uberaba',
  'Limeira',
  'Volta Redonda',
  'Ponta Grossa',
  'Magé',
  'Barueri',
  'Lauro de Freitas',
  'Petrolina',
  'Marília',
  'Itabuna',
  'Cotia',
  'Embu das Artes',
  'Ilhéus',
  'Cabo Frio',
  'São Vicente',
  'Marabá',
  'Caucaia',
  'Ipatinga',
  'Presidente Prudente',
  'Divinópolis',
  'São Carlos',
  'Araraquara',
  'Indaiatuba',
  'Taubaté',
  'Americana',
  'Belém',
  'Caxias',
  'Parnamirim',
  'Mossoró',
  'Paulista',
  'Camaçari',
  'Hortolândia',
  'Governador Valadares',
  'Sumaré',
  'Rio Branco',
  'Santarém',
  'Palmas',
  'Macaé',
  'Rondonópolis',
  'Sinop',
  'Passo Fundo',
  'Santa Maria',
  'Cachoeiro de Itapemirim',
  'Feira de Santana',
  'Sertãozinho',
  'Várzea Grande',
  'Rio Verde',
  'Dourados',
  'Arapiraca',
]

/**
 * Mapa de nome normalizado (minúsculo) → posição no ranking.
 * Construído uma vez e reutilizado em todas as chamadas.
 */
const RANK_MAP = new Map<string, number>(
  CITY_POPULATION_RANK.map((city, idx) => [city.toLowerCase(), idx])
)

/**
 * Ordena uma lista de cidades colocando as mais populosas/relevantes primeiro.
 * Cidades fora do ranking são ordenadas alfabeticamente após as ranqueadas.
 */
export function sortCitiesByRelevance(cities: string[]): string[] {
  return [...cities].sort((a, b) => {
    const rankA = RANK_MAP.get(a.toLowerCase()) ?? Infinity
    const rankB = RANK_MAP.get(b.toLowerCase()) ?? Infinity

    // Ambas ranqueadas: ordem de relevância
    if (rankA !== Infinity && rankB !== Infinity) return rankA - rankB
    // Só A ranqueada: A vem primeiro
    if (rankA !== Infinity) return -1
    // Só B ranqueada: B vem primeiro
    if (rankB !== Infinity) return 1
    // Nenhuma ranqueada: alfabético
    return a.localeCompare(b, 'pt-BR')
  })
}
