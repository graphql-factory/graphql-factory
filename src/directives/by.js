import { get, assert } from '../jsutils';
import { DirectiveLocation } from 'graphql';

function isString(str) {
  return typeof str === 'string' && str !== '';
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

function getResolveUser(info, name) {
  if (!isString(name)) {
    return defaultResolveUser;
  }
  const fn = get(info, [ 'definition', 'functions', name ]);
  assert(typeof fn === 'function', 'DirectiveError: @by requires ' +
  'that the resolverUser argument be a reference to a resolve ' +
  'function that can resolve the userID from the request');
  return fn;
}

export default {
  name: 'by',
  description: 'Adds change data to the arguments based on user',
  locations: [
    DirectiveLocation.FIELD,
    DirectiveLocation.FIELD_DEFINITION
  ],
  args: {
    resolveUser: {
      type: 'String',
      description: 'Reference to a resolver function that returns the ' +
      'userID value. Uses a default function if omitted.'
    },
    createdByField: {
      type: 'String',
      description: 'Argument name to use for setting the userID ' +
      'of the creator. If omitted, the argument will not be set. Should ' +
      'only be set on mutations that create.'
    },
    modifiedByField: {
      type: 'String',
      description: 'Argument name to use for setting the userID ' +
      'of the modifier. If omitted, the argument will not be set. Should ' +
      'only be set on mutations that modify.'
    }
  },
  resolve(source, args, context, info) {
    assert(
      isString(args.createdByField) && isString(args.modifiedByField),
      'DirectiveError: @by requires either createdByField and/or ' +
      'modifiedByField arguments to be set'
    );
    const resolveUser = getResolveUser(info, args.resolveUser);
    const userID = resolveUser(source, args, context, info);
    assert(isString(userID), 'DirectiveError: @by is unable to resolve the ' +
    'userID with the given resolveUser function');

    if (isString(args.createdByField)) {
      info.attachInfo.args[args.createdByField] = userID;
    }
    if (isString(args.modifiedByField)) {
      info.attachInfo.args[args.modifiedByField] = userID;
    }
  }
};
