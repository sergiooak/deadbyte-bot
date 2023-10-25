export default {
  path: 'information',
  name: 'Information',
  description: 'Get information from the web',
  endpoints: {
    ip: {
      path: 'ip',
      name: 'Get IP Address',
      description: 'Get the IP address of the request maker (the bot)',
      params: { }
    },
    datetime: {
      path: 'datetime',
      name: 'Get Date and Time',
      description: 'Get the current date and time',
      params: { }
    },
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
