declare module 'node-webpmux' {
  export class Image {
    exif?: Buffer
    load(data: Buffer | string): Promise<void>
    save(path?: string | null): Promise<Buffer | void>
  }

  const webpmux: {
    Image: typeof Image
  }

  export default webpmux
}
