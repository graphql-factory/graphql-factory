// @flow
function validateDefinition () {
  return true;
}

class SchemaDefinition {
  constructor (definition) {
    let _definition = definition;
    if (definition instanceof SchemaDefinition) {
      _definition = definition._definition;
    }
    if (_definition && !validateDefinition(_definition)) {
      throw new Error('Invalid SchemaBacking');
    }
    this._definition = _definition || {};
  }

  use (...args) {

  }
}

SchemaDefinition.validate = validateDefinition;

export { SchemaDefinition }