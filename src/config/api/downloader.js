export default {
  path: 'downloader',
  name: 'Downloader',
  description: 'Download files from the web',
  endpoints: {
    any: {
      path: 'any',
      name: 'Download Any File',
      description: 'Download any file from the web in any format',
      params: {
        url: {
          type: 'string',
          required: true,
          description: 'URL of the file'
        }
      }
    },
    anyfriendly: {
      path: 'any/friendly',
      name: 'Download Any File Friendly',
      description: 'Download any file from the web in friendly formats',
      params: {
        url: {
          type: 'string',
          required: true,
          description: 'URL of the file'
        }
      }
    },
    anyfull: {
      path: 'any/any/full',
      name: 'Full return of YTDLP',
      description: 'Download any file from the web in any format',
      params: {
        url: {
          type: 'string',
          required: true,
          description: 'URL of the file'
        }
      }
    },
    spotify: {
      path: 'spotify',
      name: 'Spotify Downloader',
      description: 'Download a song from Spotify',
      params: {
        url: {
          type: 'string',
          required: true,
          description: 'URL of the song'
        }
      }
    },
    spotifysearch: {
      path: 'spotify/search',
      name: 'Spotify Search',
      description: 'Search for a song in Spotify',
      params: {
        query: {
          type: 'string',
          required: true,
          description: 'Query to search'
        }
      }
    }
  }
}
