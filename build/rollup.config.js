import babel from 'rollup-plugin-babel';
import 'babel-preset-es2015-rollup'

export default {
  entry: 'src/index.js',
  format: 'cjs',
  plugins: [ babel() ],
  dest: 'index.js'
}