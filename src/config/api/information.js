export default {
  path: 'information',
  name: 'Information',
  description: 'Get information from the web',
  endpoints: {
    qr: {
      path: 'qr',
      name: 'Read Image QR Code',
      description: 'Search for a QR Code in an image',
      params: {
        url: {
          type: 'string',
          required: true,
          description: 'URL of the image'
        }
      }
    }
  }
}
