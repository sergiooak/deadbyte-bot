import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildTexasApiUrl, fetchTexasAttp } from '../src/services/texas/texas-api.service.js'

describe('Texas API service', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('builds ATTP URLs with the configured API key and text', () => {
    vi.stubEnv('DEADBYTE_TEXAS_API_KEY', 'test-key')

    const url = buildTexasApiUrl('attp', {
      name: '1',
      txt: 'O texto vai aqui'
    })

    expect(url).toBe('https://api.texaswho.net.br/attp?apikey=test-key&name=1&txt=O+texto+vai+aqui')
  })

  it('requires DEADBYTE_TEXAS_API_KEY before building Texas URLs', () => {
    vi.stubEnv('DEADBYTE_TEXAS_API_KEY', '')

    expect(() => buildTexasApiUrl('attp', {
      name: '1',
      txt: 'bom dia'
    })).toThrow('DEADBYTE_TEXAS_API_KEY')
  })

  it('resolves the ATTP result URL and downloads the webp', async () => {
    vi.stubEnv('DEADBYTE_TEXAS_API_KEY', 'test-key')

    const webp = Buffer.from('webp-data')
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          message: 'Comando executado',
          result: 'https://api.texaswho.net.br/attp?apikey=test-key&&downLoad=1782004944943.webp'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'image/webp' }),
        arrayBuffer: async () => webp.buffer.slice(webp.byteOffset, webp.byteOffset + webp.byteLength)
      })

    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTexasAttp('bom dia')).resolves.toEqual({
      buffer: webp,
      mimeType: 'image/webp'
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.texaswho.net.br/attp?apikey=test-key&name=1&txt=bom+dia')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.texaswho.net.br/attp?apikey=test-key&&downLoad=1782004944943.webp')
  })
})
