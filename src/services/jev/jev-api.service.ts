const TYPESAFE_API_URL = 'https://api.typesafe.ai/v1/systemone'
const JEV_MODEL = 'jev-latest'

const QUESTION_ID = 'q'

type NoulAnswer = {
  type: 'noul'
  noul: number
}

type ChoiceAnswer = {
  type: 'choice'
  choice: string
  probabilities: Record<string, number>
  confidence: number
}

type SystemOneResponse = {
  model: string
  answers: Record<string, NoulAnswer | ChoiceAnswer>
}

export type JevNoulResult = {
  kind: 'noul'
  /** Probabilidade (0-1) de a resposta ser "sim". */
  probability: number
}

export type JevChoiceResult = {
  kind: 'choice'
  /** Opcao escolhida (uma das enviadas em `options`). */
  choice: string
  /** Probabilidade (0-1) da opcao escolhida. */
  probability: number
  /** Confianca (0-1) da distribuicao. */
  confidence: number
  /** Opcoes ordenadas da mais provavel para a menos provavel. */
  ranked: Array<{ option: string; probability: number }>
}

function requireJevApiKey(): string {
  const apiKey = process.env.DEADBYTE_TYPESAFE_API_KEY?.trim()
  if (!apiKey) throw new Error('DEADBYTE_TYPESAFE_API_KEY is required to call the Jev (TypeSafe) API.')
  return apiKey
}

function buildState(question: string, context: string | null): Record<string, string> {
  return context ? { question, referencedMessage: context } : { question }
}

async function callSystemOne(body: Record<string, unknown>): Promise<SystemOneResponse> {
  const response = await fetch(TYPESAFE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${requireJevApiKey()}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000)
  })
  if (!response.ok) throw new Error(`Jev API error: ${response.status} ${response.statusText}`)
  return response.json() as Promise<SystemOneResponse>
}

/**
 * Pergunta sim/nao ao Jev usando a primitiva Noul.
 * Retorna a probabilidade (0-1) de a resposta ser "sim".
 */
export async function askJevYesNo(question: string, context: string | null = null): Promise<JevNoulResult> {
  const payload = await callSystemOne({
    model: JEV_MODEL,
    state: buildState(question, context),
    questions: {
      [QUESTION_ID]: {
        type: 'noul',
        instructions: question,
        criteria: {
          true: 'A resposta para a pergunta é sim / verdadeiro / provável.',
          false: 'A resposta para a pergunta é não / falso / improvável.'
        }
      }
    }
  })

  const answer = payload.answers[QUESTION_ID]
  if (!answer || answer.type !== 'noul') throw new Error('Jev API did not return a noul answer.')
  return { kind: 'noul', probability: answer.noul }
}

/**
 * Pergunta ao Jev qual das `options` melhor responde a pergunta, usando a primitiva Choice.
 * Cada opcao vira uma chave do criteria; a resposta echa a opcao original.
 */
export async function askJevChoice(question: string, options: string[], context: string | null = null): Promise<JevChoiceResult> {
  const criteria: Record<string, string> = {}
  for (const option of options) criteria[option] = option

  const payload = await callSystemOne({
    model: JEV_MODEL,
    state: buildState(question, context),
    questions: {
      [QUESTION_ID]: {
        type: 'choice',
        instructions: question,
        criteria
      }
    }
  })

  const answer = payload.answers[QUESTION_ID]
  if (!answer || answer.type !== 'choice') throw new Error('Jev API did not return a choice answer.')

  const ranked = Object.entries(answer.probabilities ?? {})
    .map(([option, probability]) => ({ option, probability }))
    .sort((a, b) => b.probability - a.probability)

  return {
    kind: 'choice',
    choice: answer.choice,
    probability: answer.probabilities?.[answer.choice] ?? 0,
    confidence: answer.confidence,
    ranked
  }
}
