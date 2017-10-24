import babel from 'rollup-plugin-babel'
import babelrc from 'babelrc-rollup'

const babelConfig = {
  presets: [
    ['env']
  ]
}

export default {
  input: 'src/index.js',
  external: [
    'events',
    'graphql-factory-plugin'
  ],
  plugins: [
    babel(
      babelrc({
        addExternalHelpersPlugin: true,
        config: babelConfig,
        exclude: 'node_modules/**'
      })
    )
  ],
  output: {
    format: 'cjs',
    file: 'index.js'
  }
}