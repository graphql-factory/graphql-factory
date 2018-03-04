import { DirectiveLocation, GraphQLError } from 'graphql';
import { lodash as _, forEach } from '../jsutils';
import assert from 'assert';

export default {
  name: 'typeConfig',
  description:
    'Assigns functions from the function store to a ' + 'type configuration',
  locations: [
    DirectiveLocation.OBJECT,
    DirectiveLocation.SCALAR,
    DirectiveLocation.INTERFACE,
    DirectiveLocation.UNION,
  ],
  args: {
    isTypeOf: {
      type: 'String',
      description:
        'A reference to an isTypeOf function. Can only be used ' +
        'on a GraphQLObjectType',
    },
    returnType: {
      type: 'String',
      description:
        'A reference to a returnType function. Can only be ' +
        'used on a GraphQLInterfaceType or GraphQLUnionType',
    },
    serialize: {
      type: 'String',
      description:
        'A reference to a serialize function. Can only be ' +
        'used on a GraphQLScalarType',
    },
    parseValue: {
      type: 'String',
      description:
        'A reference to a parseValue function. Can only be ' +
        'used on a GraphQLScalarType',
    },
    parseLiteral: {
      type: 'String',
      description:
        'A reference to a parseLiteral function. Can only be ' +
        'used on a GraphQLScalarType',
    },
  },
  build(source, args, context, info) {
    try {
      forEach(
        args,
        (name, type) => {
          const path = ['definition', 'functions', name];
          const fn = _.get(info, path);
          assert(
            _.isFunction(fn),
            '@typeConfig ' +
              type +
              ' function ' +
              name +
              ' was not found in the function store',
          );

          switch (type) {
            case 'isTypeOf':
              assert(
                source.type === 'Object',
                '@typeConfig directive argument ' +
                  type +
                  ' argument can only be used on GraphQLObjectType',
              );
              break;
            case 'returnType':
              assert(
                source.type === 'Interface' || source.type === 'Union',
                '@typeConfig directive argument ' +
                  type +
                  ' argument can ' +
                  'only be used on GraphQLInterfaceType or GraphQLUnionType',
              );
              break;
            case 'serialize':
            case 'parseLiteral':
            case 'parseValue':
              assert(
                source.type === 'Scalar',
                '@typeConfig directive argument type argument can ' +
                  'only be used on GraphQLScalarType',
              );
              break;
            default:
              return;
          }
          // if all assertings pass, set the function
          source[type] = fn;
        },
        true,
      );
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  },
};
