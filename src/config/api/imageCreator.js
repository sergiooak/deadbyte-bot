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
    }
  }
}
