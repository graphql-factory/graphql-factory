import { lodash as _, forEach } from '../jsutils';
import { getNamedTypeLocation } from '../utilities';
import { DirectiveLocation } from 'graphql';

/**
 * Processes the beforeBuild function of a directive
 * @param {*} source 
 * @param {*} sourceName 
 * @param {*} directiveName 
 * @param {*} args 
 * @param {*} location 
 */
export function executeDirective(
  source,
  sourceName,
  directiveName,
  args,
  location
) {
  const { locations, beforeBuild } = _.get(
    this.directives,
    [ directiveName ],
    {}
  );

  // check that beforeBuild is a function and that the
  // current location is valid for the directive
  if (_.isFunction(beforeBuild) && _.includes(locations, location)) {
    beforeBuild(source, args, this.context, {
      location,
      sourceName,
      definition: this
    });
  }
}

/**
 * Processes each directive
 * @param {*} objDef 
 * @param {*} objName 
 * @param {*} location 
 */
export function executeDirectives(objDef, objName, location) {
  forEach(_.get(objDef, '@directives'), (args, name) => {
    executeDirective.call(this, objDef, objName, name, args, location);
  }, true);
}

/**
 * Processes schema directives
 */
export function processSchema() {
  executeDirectives.call(
    this,
    this.schema,
    'schema',
    DirectiveLocation.SCHEMA
  );
}

/**
 * Processes argument directives
 * @param {*} objDef 
 * @param {*} objName 
 */
export function processArg(objDef, objName) {
  executeDirectives.call(
    this,
    objDef,
    objName,
    DirectiveLocation.INPUT_FIELD_DEFINITION
  );
}

/**
 * Processes field directives
 * @param {*} objDef 
 * @param {*} objName 
 */
export function processField(objDef, objName) {
  executeDirectives.call(
    this,
    objDef,
    objName,
    DirectiveLocation.FIELD_DEFINITION
  );

  forEach(_.get(objDef, 'args'), (argDef, argName) => {
    processArg.call(this, argDef, argName);
  }, true);
}

/**
 * Processes enum value directives
 * @param {*} objDef 
 * @param {*} objName 
 */
export function processValue(objDef, objName) {
  executeDirectives.call(
    this,
    objDef,
    objName,
    DirectiveLocation.ENUM_VALUE
  );
}

/**
 * Processes type directives
 * @param {*} objDef 
 * @param {*} objName 
 */
export function processType(objDef, objName) {
  executeDirectives.call(
    this,
    objDef,
    objName,
    getNamedTypeLocation(objDef.type)
  );

  forEach(_.get(objDef, 'fields'), (fieldDef, fieldName) => {
    processField.call(this, fieldDef, fieldName);
  }, true);
  forEach(_.get(objDef, 'values'), (valueDef, valueName) => {
    processValue.call(this, valueDef, valueName);
  }, true);
}

/**
 * Processes directive arg directives
 * @param {*} dirDef 
 */
export function processDirective(dirDef) {
  forEach(_.get(dirDef, 'args'), (argDef, argName) => {
    processArg.call(this, argDef, argName);
  }, true);
}

/**
 * Processes all beforeBuild directive resolvers
 */
export function beforeBuildResolver() {
  // process schema
  processSchema.call(this);

  // process types
  forEach(this.types, (typeDef, typeName) => {
    processType.call(this, typeDef, typeName);
  }, true);

  // process directives
  forEach(this.directives, dirDef => {
    processDirective.call(this, dirDef);
  }, true);
}
