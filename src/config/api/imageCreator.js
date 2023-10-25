export default {
  path: 'image-creator',
  name: 'Image Creator',
  description: 'Create images on the fly',
  endpoints: {
    ttp: {
      path: 'ttp/1',
      name: 'Text to Picture',
      description: 'Create a 512x512 image with text',
      params: {
        message: {
          type: 'string',
          required: true,
          description: 'Text to be written on the image'
        },
        subtitle: {
          type: 'boolean',
          required: false,
          description: 'If the text should be written on the bottom of the image'
        }
      }
    },
    ttp2: {
      path: 'ttp/2',
      name: 'Text to Picture 2',
      description: 'Create a 512x512 image with text',
      params: {
        message: {
          type: 'string',
          required: true,
          description: 'Text to be written on the image'
        },
        subtitle: {
          type: 'boolean',
          required: false,
          description: 'If the text should be written on the bottom of the image'
        }
      }
    },
    ttp3: {
      path: 'ttp/3',
      name: 'Text to Picture 3',
      description: 'Create a 512x512 image with text',
      params: {
        message: {
          type: 'string',
          required: true,
          description: 'Text to be written on the image'
        },
        subtitle: {
          type: 'boolean',
          required: false,
          description: 'If the text should be written on the bottom of the image'
        }
      }
    },
    qr: {
      path: 'qr',
      name: 'QR Code Image',
      description: 'Create a QR Code image',
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
    },
    e360list: {
      path: 'ephoto360/list',
      name: 'ePhoto360 List',
      description: 'Get a list of all ePhoto360 templates',
      params: {
      }
    },
    e360: {
      path: 'ephoto360/{{name}}',
      name: 'ePhoto360',
      description: 'Create an ePhoto360 image',
      params: {
        text1: {
          type: 'string',
          required: true,
          description: 'Text 1'
        },
        text2: {
          type: 'string',
          required: true,
          description: 'Text 2'
        },
        text3: {
          type: 'string',
          required: true,
          description: 'Text 3'
        }
      }
    }
  }
}
