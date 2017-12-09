import { GraphQLFactoryDirective } from '../types';
import { DirectiveLocation } from 'graphql';

function get(object, path, defaultValue) {
  try {
    if (!Array.isArray(path) || !path.length) {
      return defaultValue;
    }
    let obj = object;
    let key = null;
    while(path.length) {
      key = path.shift();
      if (Object.getOwnPropertyNames(obj).indexOf(String(key)) === -1) {
      	return defaultValue;
      }
      obj = obj[key];
    }
    return obj;
  } catch (err) {
    return defaultValue;
  }
}

/**
 * Default user id resolver, checks args, then context, then rootValue
 * for a userID value
 * @param {*} source 
 * @param {*} args 
 * @param {*} context 
 * @param {*} info 
 */
function defaultResolveUser(source, args, context, info) {
  return get(args, [ 'userID' ]) ||
    get(context, [ 'userID' ]) ||
    get(info, [ 'rootValue', 'userID' ]);
}

export default new GraphQLFactoryDirective({
  name: 'by',
  description: 'Adds change data to the arguments based on user',
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FIELD_DEFINITION
  ],
  args: {
    value: {
      resolveUser: 'String',
      createdByField: 'String',
      createdOnField: 'String',
      modifiedByField: 'String',
      modifiedOnField: 'String' 
    }
  },
  resolve(source, args, context, info) {
  }
});
