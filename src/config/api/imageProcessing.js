export default {
  path: 'image-processing',
  name: 'Image Processing',
  description: 'Edit images on the fly',
  endpoints: {
    removebg: {
      path: 'removebg',
      name: 'Remove Background',
      description: 'Remove the background of an static image',
      params: {
        url: {
          type: 'string',
          required: true,
          description: 'URL of the image'
        },
        trim: {
          type: 'boolean',
          required: false,
          description: 'If the image should be trimmed'
        }
      }
    }
  }
}
