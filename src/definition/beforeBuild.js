import { lodash as _, promiseReduce, promiseMap } from '../jsutils';
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
    return beforeBuild(source, args, this.context, {
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
  return promiseReduce(_.get(objDef, '@directives'), (accum, args, name) => {
    return executeDirective.call(this, objDef, objName, name, args, location);
  }, undefined, true);
}

/**
 * Processes schema directives
 */
export function processSchema() {
  return executeDirectives.call(
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
  return executeDirectives.call(
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
  return Promise.all([
    executeDirectives.call(
      this,
      objDef,
      objName,
      DirectiveLocation.FIELD_DEFINITION
    ),
    promiseMap(_.get(objDef, 'args'), (argDef, argName) => {
      return processArg.call(this, argDef, argName);
    }, true)
  ]);
}

/**
 * Processes enum value directives
 * @param {*} objDef 
 * @param {*} objName 
 */
export function processValue(objDef, objName) {
  return executeDirectives.call(
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
  return Promise.all([
    executeDirectives.call(
      this,
      objDef,
      objName,
      getNamedTypeLocation(objDef.type)
    ),
    promiseMap(_.get(objDef, 'fields'), (fieldDef, fieldName) => {
      return processField.call(this, fieldDef, fieldName);
    }, true),
    promiseMap(_.get(objDef, 'values'), (valueDef, valueName) => {
      return processValue.call(this, valueDef, valueName);
    }, true)
  ]);
}

/**
 * Processes directive arg directives
 * @param {*} dirDef 
 */
export function processDirective(dirDef) {
  return promiseMap(_.get(dirDef, 'args'), (argDef, argName) => {
    return processArg.call(this, argDef, argName);
  }, true);
}

/**
 * Processes all beforeBuild directive resolvers
 */
export function beforeBuildResolver() {
  return this._promise
    .then(() => {
      return Promise.all([
        processSchema.call(this),
        promiseMap(this.types, (typeDef, typeName) => {
          return processType.call(this, typeDef, typeName);
        }, true),
        promiseMap(this.directives, dirDef => {
          return processDirective.call(this, dirDef);
        }, true)
      ]);
    });
}
