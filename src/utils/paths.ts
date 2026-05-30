import { resolve } from 'pathe'

export function resolveFromCwd(path: string): string {
  return resolve(process.cwd(), path)
}
