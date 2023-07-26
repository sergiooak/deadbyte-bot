import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
const argv = yargs(hideBin(process.argv)).argv

const text = argv.text || argv._.join(' ')

function generateCommentTitle (text) {
  const maxLength = 90
  const paddingLength = maxLength - text.length - 6
  const paddingLeft = '='.repeat(Math.floor(paddingLength / 2))
  const paddingRight = '='.repeat(Math.ceil(paddingLength / 2))
  const title = `// ${paddingLeft} ${text} ${paddingRight}`
  console.log('//')
  console.log(title)
  console.log('//')
}

generateCommentTitle(text)
