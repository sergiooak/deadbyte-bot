export class CommandQueue {
  private tail = Promise.resolve()

  enqueue(task: () => Promise<void>): Promise<void> {
    const next = this.tail.then(task, task)
    this.tail = next.catch(() => undefined)
    return next
  }
}
