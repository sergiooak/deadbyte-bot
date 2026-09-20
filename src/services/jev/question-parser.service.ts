const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const PARSER_MODEL = 'gpt-4o-mini'

const MAX_OPTIONS = 6
const MAX_OPTION_LENGTH = 60
const MAX_COMMENT_LENGTH = 120
const MAX_EMOJI_LENGTH = 8
const COMMENT_VARIANTS = 2

/** Chaves de comentario/emoji para o resultado sim/nao (Noul). */
export const YES_KEY = 'sim'
export const NO_KEY = 'nao'

/**
 * Pergunta ja estruturada, pronta para o Jev, com os debochos e emojis por
 * resultado. Cada resultado tem ate {@link COMMENT_VARIANTS} variacoes de texto
 * (o codigo transforma em spintax) e um emoji para identificar a opcao.
 *
 * - `type` 'yes_no' => sim/nao (Noul); `comments`/`emojis` usam as chaves 'sim' e 'nao'.
 * - `type` 'choice' => escolha entre `options` (Choice); as chaves sao cada opcao.
 */
export type ParsedQuestion = {
  question: string
  type: 'yes_no' | 'choice'
  options: string[]
  comments: Record<string, string[]>
  emojis: Record<string, string>
}

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

const SYSTEM_PROMPT = [
  'Você prepara a pergunta de um usuário para um modelo de julgamento (o "Jev") e escreve o deboche que acompanha a resposta.',
  'Responda SOMENTE com um objeto JSON válido, sem texto extra, neste formato:',
  '{ "question": string, "type": "yes_no" | "choice", "options": string[], "emojis": { "<chave>": string }, "comments": { "<chave>": [string, string] } }',
  '',
  'Contexto:',
  '- O usuário pode responder a uma mensagem. Quando houver "Mensagem citada", a pergunta provavelmente se refere a ela.',
  '- Nesse caso, escreva "question" de forma autocontida referindo-se a "a mensagem citada" (NÃO copie o texto citado inteiro; o Jev recebe o texto à parte).',
  '',
  'Regras da pergunta:',
  '- "question": pergunta clara, objetiva e autocontida, em português do Brasil.',
  '- Pergunta naturalmente de sim/não => type "yes_no" e "options": [].',
  '- O usuário oferece/implica alternativas (ex: "pizza ou sushi?", listas) => type "choice" com cada alternativa como item curto em "options".',
  `- No máximo ${MAX_OPTIONS} opções, cada uma com até ${MAX_OPTION_LENGTH} caracteres, sem numeração nem marcadores.`,
  '- Nunca invente opções que o usuário não pediu. Em dúvida entre sim/não e escolha, prefira "yes_no".',
  '',
  'Regras dos emojis ("emojis"):',
  '- Um único emoji para CADA resultado, que ajude a identificar a opção (ex: "pizza" => 🍕, "sim" => ✅).',
  `- Para type "yes_no", use as chaves "${YES_KEY}" e "${NO_KEY}". Para type "choice", use o texto EXATO de cada opção.`,
  '- Escolha emojis diferentes entre si quando possível. Apenas o emoji, sem texto.',
  '',
  'Regras dos comentários ("comments"):',
  '- Um comentário para CADA resultado possível, como se aquele resultado tivesse vencido.',
  `- Para type "yes_no", use as chaves "${YES_KEY}" e "${NO_KEY}". Para type "choice", use o texto EXATO de cada opção.`,
  `- Cada chave recebe ${COMMENT_VARIANTS} variações diferentes (array com ${COMMENT_VARIANTS} strings).`,
  `- Cada variação: curta (até ${MAX_COMMENT_LENGTH} caracteres), sarcástica, debochada e engraçada, em português do Brasil informal. É zoeira entre amigos.`,
  '- Pode ser ácido e provocativo. NÃO seja politicamente correto nem faça ressalvas.',
  '- Proibido apenas: discurso de ódio, ataque a grupos protegidos (raça, religião, gênero, orientação, etc.) e assédio real a pessoas.',
  '- Não use aspas nem quebras de linha dentro das variações.'
].join('\n')

function requireOpenAiApiKey(): string {
  const apiKey = process.env.DEADBYTE_OPENAI_API_KEY?.trim()
  if (!apiKey) throw new Error('DEADBYTE_OPENAI_API_KEY is required to parse questions for Jev.')
  return apiKey
}

function buildUserContent(rawText: string, context: string | null): string {
  if (!context) return rawText
  return `Mensagem citada: "${context}"\nPergunta do usuário: ${rawText}`
}

function sanitizeOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return []
  const seen = new Set<string>()
  const unique: string[] = []
  for (const raw of options) {
    if (typeof raw !== 'string') continue
    const option = raw.trim().slice(0, MAX_OPTION_LENGTH)
    if (!option) continue
    const key = option.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(option)
  }
  return unique.slice(0, MAX_OPTIONS)
}

function sanitizeVariants(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : []
  const variants: string[] = []
  for (const item of list) {
    if (typeof item !== 'string') continue
    const text = item.replace(/\s+/g, ' ').trim().slice(0, MAX_COMMENT_LENGTH)
    if (text && !variants.includes(text)) variants.push(text)
    if (variants.length >= COMMENT_VARIANTS) break
  }
  return variants
}

function sanitizeComments(raw: unknown, keys: string[]): Record<string, string[]> {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const comments: Record<string, string[]> = {}
  for (const key of keys) {
    const variants = sanitizeVariants(source[key])
    if (variants.length > 0) comments[key] = variants
  }
  return comments
}

function sanitizeEmojis(raw: unknown, keys: string[]): Record<string, string> {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const emojis: Record<string, string> = {}
  for (const key of keys) {
    const value = source[key]
    if (typeof value !== 'string') continue
    const emoji = value.replace(/\s+/g, '').slice(0, MAX_EMOJI_LENGTH)
    if (emoji) emojis[key] = emoji
  }
  return emojis
}

/**
 * Usa um modelo barato (gpt-4o-mini) para transformar o texto livre do usuario
 * em uma {@link ParsedQuestion} pronta para o Jev, ja com debochos e emojis por
 * resultado. `context` e o texto de uma mensagem citada (quando o usuario responde
 * a outra mensagem). Menos de 2 opcoes distintas cai para sim/nao.
 */
export async function parseQuestion(rawText: string, context: string | null = null): Promise<ParsedQuestion> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireOpenAiApiKey()}`
    },
    body: JSON.stringify({
      model: PARSER_MODEL,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserContent(rawText, context) }
      ]
    }),
    signal: AbortSignal.timeout(30_000)
  })
  if (!response.ok) throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)

  const payload = await response.json() as OpenAiResponse
  const content = payload.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('OpenAI API returned an empty parser response.')

  let parsed: { question?: unknown; type?: unknown; options?: unknown; comments?: unknown; emojis?: unknown }
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('OpenAI API returned invalid JSON for the parsed question.')
  }

  const question = typeof parsed.question === 'string' ? parsed.question.trim() : ''
  if (!question) throw new Error('Parser did not produce a question.')

  const options = sanitizeOptions(parsed.options)
  // A decisao final e do codigo: precisa de >= 2 opcoes distintas para ser Choice.
  const type: ParsedQuestion['type'] = parsed.type === 'choice' && options.length >= 2 ? 'choice' : 'yes_no'
  const commentKeys = type === 'choice' ? options : [YES_KEY, NO_KEY]

  return {
    question,
    type,
    options: type === 'choice' ? options : [],
    comments: sanitizeComments(parsed.comments, commentKeys),
    emojis: sanitizeEmojis(parsed.emojis, commentKeys)
  }
}
