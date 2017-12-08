import {
  isObject,
  forEach,
  map,
  get,
  reduce
} from '../jsutils';
import {
  DirectiveLocation,
  GraphQLDirective
} from 'graphql';
/**
 * Checks that a directive is included and throws an error otherwise
 * @param {*} msgPrefix 
 * @param {*} directives 
 * @param {*} def 
 * @param {*} depth 
 */
export function checkDirectives(
  location,
  directiveMap,
  msgPrefix,
  directives,
  def,
  depth = 0
) {
  const level = depth + 1;

  // check for cyclical directive definitions
  if (level > 50) {
    throw new Error('Circular directive dependency encountered. ' +
    'Please check that directives applied on directive arguments do not' +
    'reference parents');
  }
  const dirs = get(def, [ '@directives' ]);

  if (!isObject(dirs)) {
    return;
  }

  forEach(dirs, (args, name) => {
    const m = msgPrefix + ' directive "' + name + '"';
    if (isObject(args)) {
      forEach(args, (argDef, argName) => {
        checkDirectives(
          DirectiveLocation.INPUT_FIELD_DEFINITION,
          directiveMap,
          m + ', argument "' + argName + '"',
          directives,
          argDef,
          level
        );
      }, true);
    }

    if (directives.indexOf(name) === -1) {
      throw new Error(m + ' is not included in the schema definition\'s ' +
      'directive include declaration');
    }

    if (directiveMap[name].locations.indexOf(location) === -1) {
      throw new Error('DirectiveError: Directive @' + name +
      ' is not allowed on location ' + location);
    }
  }, true);
}

/**
 * Validates that directives applied at locations have been
 * included in the schema definition
 * @param {*} definition 
 */
export function validateDirectives(definition) {
  const def = definition._config;
  const directives = get(def, [ 'schema', 'directives' ], []);

  // validate that the directives have been included on the schema
  // with their names and not with @ prefixing that name. Also allow
  // an instance of a directive
  const dirs = map(directives, directive => {
    if (typeof directive === 'string') {
      if (directive.match(/^@/)) {
        throw new Error('DirectiveError: Directives names should not be' +
        'prefixed with an @ symbol when including them on a schema ' +
        'definition');
      }
      return directive;
    } else if (directive instanceof GraphQLDirective) {
      return directive.name;
    }
    throw new Error('Invalid directive value supplied in schema definition');
  }, true);

  // check that there is a definition for the directive while
  // creating a map of definitions. The definition map will be used
  // to validate that the location the directive is placed in is
  // valid
  const directiveMap = reduce(dirs, (dmap, name) => {
    const directiveDef = get(def, [ 'directives', name ]);
    if (!directiveDef) {
      throw new Error('DirectiveError: No directive with name ' + name +
      'found in definition. Unable to include.');
    }
    dmap[name] = directiveDef;
    return dmap;
  }, {}, true);

  // check types
  forEach(def.types, (typeDef, typeName) => {
    const typeMsg = 'DirectiveError: type "' + typeName + '"';
    let typeLoc = null;

    // get the type location
    switch (typeDef.type) {
      case 'Object':
        typeLoc = DirectiveLocation.OBJECT;
        break;
      case 'Input':
        typeLoc = DirectiveLocation.INPUT_OBJECT;
        break;
      case 'Scalar':
        typeLoc = DirectiveLocation.SCALAR;
        break;
      case 'Enum':
        typeLoc = DirectiveLocation.ENUM;
        break;
      case 'Interface':
        typeLoc = DirectiveLocation.INTERFACE;
        break;
      case 'Union':
        typeLoc = DirectiveLocation.UNION;
        break;
      default:
        break;
    }

    // check the type location
    checkDirectives(
      typeLoc,
      directiveMap,
      typeMsg,
      dirs,
      typeDef
    );

    // check subfields and values
    switch (typeDef.type) {
      case 'Object':
      case 'Input':
      case 'Interface':
        forEach(typeDef.fields, (fieldDef, fieldName) => {
          const fieldMsg = typeMsg + ', field "' + fieldName + '"';

          if (isObject(fieldDef.args)) {
            forEach(fieldDef.args, (argDef, argName) => {
              checkDirectives(
                DirectiveLocation.INPUT_FIELD_DEFINITION,
                directiveMap,
                fieldMsg + ', argument "' + argName + '"',
                dirs,
                argDef
              );
            });
          }
          checkDirectives(
            DirectiveLocation.FIELD_DEFINITION,
            directiveMap,
            fieldMsg,
            dirs,
            fieldDef
          );
        }, true);
        break;

      case 'Enum':
        forEach(typeDef.values, (valueDef, valueName) => {
          checkDirectives(
            DirectiveLocation.ENUM_VALUE,
            directiveMap,
            typeMsg + ', value "' + valueName + '"',
            dirs,
            valueDef
          );
        }, true);
        break;

      default:
        break;
    }
  }, true);

  // check directives
  forEach(def.directives, (dirDef, dirName) => {
    const dirMsg = 'Directive "' + dirName + '"';
    forEach(dirDef.args, (argDef, argName) => {
      checkDirectives(
        DirectiveLocation.INPUT_FIELD_DEFINITION,
        directiveMap,
        dirMsg + ', argument "' + argName + '"',
        dirs,
        argDef
      );
    }, true);
  }, true);

  // check schema
  checkDirectives(
    DirectiveLocation.SCHEMA,
    directiveMap,
    'Schema',
    dirs,
    def.schema
  );
}
