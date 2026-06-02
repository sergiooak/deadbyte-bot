type SpintaxNode = string | SpintaxSequenceNode | SpintaxChoiceNode

type SpintaxSequenceNode = {
  type: 'sequence'
  children: SpintaxNode[]
}

type SpintaxChoiceNode = {
  type: 'choice'
  alternatives: SpintaxSequenceNode[]
}

type ParseFrame = {
  parent: ParseFrame | null
  alternatives: SpintaxSequenceNode[]
  current: SpintaxNode[]
}

export type SpintaxRandom = () => number

export type SpintaxServiceOptions = {
  cacheSize?: number
  random?: SpintaxRandom
}

export class SpintaxService {
  private readonly cache = new Map<string, SpintaxSequenceNode>()
  private readonly cacheSize: number
  private readonly random: SpintaxRandom

  constructor(options: SpintaxServiceOptions = {}) {
    this.cacheSize = Math.max(0, options.cacheSize ?? 512)
    this.random = options.random ?? Math.random
  }

  render(input: string): string {
    if (!this.hasSpintax(input)) {
      return this.unescape(input)
    }

    return this.renderNode(this.getAst(input))
  }

  private getAst(input: string): SpintaxSequenceNode {
    const cached = this.cache.get(input)
    if (cached) {
      this.cache.delete(input)
      this.cache.set(input, cached)
      return cached
    }

    const ast = this.parse(input)
    if (this.cacheSize > 0) {
      if (this.cache.size >= this.cacheSize) {
        const oldestKey = this.cache.keys().next().value as string | undefined
        if (oldestKey) {
          this.cache.delete(oldestKey)
        }
      }
      this.cache.set(input, ast)
    }
    return ast
  }

  private parse(input: string): SpintaxSequenceNode {
    const root: ParseFrame = { parent: null, alternatives: [], current: [] }
    let frame = root
    let buffer = ''

    const flush = () => {
      if (buffer) {
        frame.current.push(buffer)
        buffer = ''
      }
    }

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index]
      const next = input[index + 1]

      if (char === '\\' && next && ['{', '}', '|', '\\'].includes(next)) {
        buffer += next
        index += 1
        continue
      }

      if (char === '{') {
        flush()
        frame = { parent: frame, alternatives: [], current: [] }
        continue
      }

      if (char === '|' && frame.parent) {
        flush()
        frame.alternatives.push({ type: 'sequence', children: frame.current })
        frame.current = []
        continue
      }

      if (char === '}' && frame.parent) {
        flush()
        frame.alternatives.push({ type: 'sequence', children: frame.current })
        const choice: SpintaxChoiceNode = { type: 'choice', alternatives: frame.alternatives }
        frame = frame.parent
        frame.current.push(choice)
        continue
      }

      buffer += char
    }

    flush()

    while (frame.parent) {
      const openText = this.flattenUnclosedFrame(frame)
      frame = frame.parent
      frame.current.push(`{${openText}`)
    }

    return { type: 'sequence', children: root.current }
  }

  private flattenUnclosedFrame(frame: ParseFrame): string {
    const parts = [...frame.alternatives.map((sequence) => this.renderStatic(sequence)), { type: 'sequence' as const, children: frame.current }]
    return parts.map((sequence) => this.renderStatic(sequence)).join('|')
  }

  private renderStatic(node: SpintaxNode): string {
    if (typeof node === 'string') {
      return node
    }

    if (node.type === 'sequence') {
      return node.children.map((child) => this.renderStatic(child)).join('')
    }

    return `{${node.alternatives.map((alternative) => this.renderStatic(alternative)).join('|')}}`
  }

  private renderNode(node: SpintaxNode): string {
    if (typeof node === 'string') {
      return node
    }

    if (node.type === 'sequence') {
      return node.children.map((child) => this.renderNode(child)).join('')
    }

    if (node.alternatives.length === 0) {
      return ''
    }

    const index = Math.floor(this.random() * node.alternatives.length)
    return this.renderNode(node.alternatives[index] ?? node.alternatives[0])
  }

  private hasSpintax(input: string): boolean {
    for (let index = 0; index < input.length; index += 1) {
      if (input[index] === '\\') {
        index += 1
        continue
      }
      if (input[index] === '{') {
        return true
      }
    }
    return false
  }

  private unescape(input: string): string {
    return input.replace(/\\([{}|\\])/g, '$1')
  }
}
