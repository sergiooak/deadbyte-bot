import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/cli/index'],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: false
  }
})
