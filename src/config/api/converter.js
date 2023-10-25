export default {
  path: 'converter',
  name: 'Converter',
  description: 'Convert things to other formats',
  endpoints: {
    to: {
      path: 'to',
      name: 'Convert to Image',
      description: 'Convert image to other formats',
      params: {
        img: {
          type: 'string',
          required: true,
          description: 'URL of the image'
        },
        format: {
          type: 'string',
          required: false,
          description: 'Format of the image. Possible values: jpeg, png, webp, tiff, gif'
        }
      }
    },
    strtohex: {
      path: 'strtohex',
      name: 'Convert String to Hexadecimal',
      description: 'Convert a string to hexadecimal',
      params: {
        text: {
          type: 'string',
          required: true,
          description: 'Text to be converted to hexadecimal'
        }
      }
    },
    hextostr: {
      path: 'hextostr',
      name: 'Convert Hexadecimal to String',
      description: 'Convert a hexadecimal to string',
      params: {
        hex: {
          type: 'string',
          required: true,
          description: 'Hexadecimal to be converted to string'
        }
      }
    },
    strtob64: {
      path: 'strtob64',
      name: 'Convert String to Base64',
      description: 'Convert a string to Base64',
      params: {
        text: {
          type: 'string',
          required: true,
          description: 'Text to be converted to Base64'
        }
      }
    },
    b64tostr: {
      path: 'b64tostr',
      name: 'Convert Base64 to String',
      description: 'Convert a Base64 to string',
      params: {
        b64: {
          type: 'string',
          required: true,
          description: 'Base64 to be converted to string'
        }
      }
    },
    strtomorse: {
      path: 'strtomorse',
      name: 'Convert String to Morse',
      description: 'Convert a string to Morse',
      params: {
        text: {
          type: 'string',
          required: true,
          description: 'Text to be converted to Morse'
        }
      }
    },
    morsetostr: {
      path: 'morsetostr',
      name: 'Convert Morse to String',
      description: 'Convert a Morse to string',
      params: {
        morse: {
          type: 'string',
          required: true,
          description: 'Morse to be converted to string'
        }
      }
    },
    strtocipher: {
      path: 'strtocipher',
      name: 'Convert String to Cipher',
      description: 'Convert a string to Cipher',
      params: {
        text: {
          type: 'string',
          required: true,
          description: 'Text to be converted to Cipher'
        }
      }
    },
    ciphertostr: {
      path: 'ciphertostr',
      name: 'Convert Cipher to String',
      description: 'Convert a Cipher to string',
      params: {
        cipher: {
          type: 'string',
          required: true,
          description: 'Cipher to be converted to string'
        }
      }
    }
  }
}
