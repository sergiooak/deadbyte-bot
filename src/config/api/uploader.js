export default {
  path: 'uploader',
  name: 'Uploader',
  description: 'Upload files to the server or temporary storages',
  endpoints: {
    tempurl: {
      path: 'tempurl',
      name: 'File Temporary URL',
      description: 'Upload a file to the server and get a temporary URL',
      params: {
        file: {
          type: 'string',
          required: false,
          description: 'A public URL to a file (IF using GET)'
        }
      }
    },
    imgtourl: {
      path: 'imgtourl',
      name: 'Image to Perm URL',
      description: 'Upload an image to ibb.co and get a permanent URL',
      params: {
        file: {
          type: 'string',
          required: false,
          description: 'A public URL to a file (IF using GET)'
        }
      }
    }
  }
}
