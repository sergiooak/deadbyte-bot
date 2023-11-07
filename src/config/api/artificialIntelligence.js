export default {
  path: 'artificial-intelligence',
  name: 'Artificial Intelligence',
  description: 'Chat GPT, image generation, etc....',
  endpoints: {
    gpt: {
      path: 'gpt',
      name: 'Chat GPT',
      description: 'Pure Chat GPT',
      params: {
        question: {
          type: 'string',
          required: false,
          description: 'The question to ask the GPT - Only GET requests'
        },
        messages: {
          type: 'array',
          required: false,
          description: 'Array of messages to send to the GPT - Only POST requests'
        }
      }
    },
    bot: {
      path: 'bot',
      name: 'Chat Bot',
      description: 'DeadByte Chat Bot',
      params: {
        question: {
          type: 'string',
          required: false,
          description: 'The question to ask the Bot - Only GET requests'
        },
        messages: {
          type: 'array',
          required: false,
          description: 'Array of messages to send to the Bot - Only POST requests'
        }
      }
    }
  }
}
