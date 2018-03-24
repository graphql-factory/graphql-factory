import { parse } from 'graphql';
import { Readable } from 'stream';
import { Useable } from './Useable';
import { astToFactoryDefinition } from '../../utilities';

export class ReadableUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(readableStream) {
    return readableStream instanceof Readable;
  }
  _use(readableStream, options) {
    const opts = Object.assign({}, options);
    const dataEvent = opts.dataEvent || 'data';
    const endEvent = opts.endEvent || 'end';
    const errorEvent = opts.errorEvent || 'error';

    return new Promise((resolve, reject) => {
      let language = '';
      readableStream
        .on(dataEvent, data => {
          language += String(data);
        })
        .on(endEvent, () => {
          const ast = parse(language);
          const def = astToFactoryDefinition(ast);
          this.definition.merge(def);
          return resolve();
        })
        .on(errorEvent, reject);
    });
  }
}
