import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'cjs',
  external: ['events'],
  plugins: [ babel() ],
  dest: 'index.js'
}