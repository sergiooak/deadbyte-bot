export class SpintaxService {
  render(input: string): string {
    return input.replace(/\{([^{}]+)\}/g, (_match, options: string) => {
      const values = options.split('|').map((value) => value.trim()).filter(Boolean)
      if (!values.length) {
        return ''
      }
      return values[Math.floor(Math.random() * values.length)] ?? values[0]
    })
  }
}
