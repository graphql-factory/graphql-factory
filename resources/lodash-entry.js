import fs from 'fs';
import path from 'path';

const reserved = [
  'function',
  'delete',
  'class',
  'new'
];
const lodashDir = path.resolve(__dirname, '../src/jsutils/lodash');
const entry = path.resolve(__dirname, '../src/jsutils/lodash.custom.js');
const _imports = [];
const _exports = [];

fs.readdir(lodashDir, (readError, files) => {
  if (readError) {
    return console.error(readError);
  }
  files.forEach(file => {
    // if not a base method, add it
    if (typeof file === 'string' && !file.match(/^_/)) {
      const method = file.replace(/\.js$/, '');
      if (method.indexOf('.') === -1 && reserved.indexOf(method) === -1) {
        _exports.push(`  ${method}`);
        _imports.push(`import ${method} from './lodash/${method}';`);
      }
    }
  });

  const output = '// auto-generated from lodash directory contents\n' +
    _imports.join('\n') + '\n\n' +
    'export {\n' + _exports.join(',\n') + '\n};\n';

  fs.writeFile(entry, output, writeError => {
    if (writeError) {
      console.error(writeError);
    }
  });
});