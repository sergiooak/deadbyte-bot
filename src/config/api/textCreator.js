export default {
  path: 'text-creator',
  name: 'Text Creator',
  description: 'Generate text on the fly',
  endpoints: {
    qr: {
      path: 'qr',
      name: 'QR Code Image',
      description: 'Create a QR Code image as text',
      params: {
        text: {
          type: 'string',
          required: true,
          description: 'URL or text to be converted to QR Code'
        },
        errorCorrectionLevel: {
          type: 'string',
          required: false,
          description: 'Error correction level. Possible values: L, M, Q, H'
        },
        margin: {
          type: 'number',
          required: false,
          description: 'Margin of the QR Code'
        },
        size: {
          type: 'number',
          required: false,
          description: 'Width/height of the QR Code'
        }
      }
    }
  }
}
