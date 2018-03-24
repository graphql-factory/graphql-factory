import { GraphQLSchema } from 'graphql';
import { Useable } from './Useable';
import {
  parseSchemaIntoAST,
  astToFactoryDefinition,
  extractSchemaBacking,
} from '../../utilities';

export class SchemaUseable extends Useable {
  constructor(definition) {
    super(definition);
  }
  _isUsable(schema) {
    return schema instanceof GraphQLSchema;
  }
  _use(schema) {
    const backing = extractSchemaBacking(schema);
    const ast = parseSchemaIntoAST(schema);
    const definition = astToFactoryDefinition(ast);

    this.definition.merge(backing);
    this.definition.merge(definition);
  }
}
