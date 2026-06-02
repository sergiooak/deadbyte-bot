export function factorial(value: number): number {
  if (value <= 1) return 1

  let result = 1
  for (let index = 2; index <= value; index += 1) {
    result *= index
  }

  return result
}
