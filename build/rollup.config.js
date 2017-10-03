import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  external: ['events'],
  plugins: [ babel() ],
  output: {
    format: 'cjs',
    file: 'index.js'
  }
}