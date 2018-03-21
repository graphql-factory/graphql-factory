import { RemoteSchema } from './RemoteSchema';
import { lodash as _ } from '../jsutils';
import { httpPOST } from '../utilities';
import { GraphQLError, introspectionQuery } from 'graphql';

function httpOpts(options, args, context, info, headers) {
  return _.merge(
    {},
    typeof options === 'function' ? options({ args, context, info }) : options,
    { headers },
  );
}

export class RemoteSchemaHTTP extends RemoteSchema {
  constructor(endpoint, options) {
    super(options);
    this._endpoint = endpoint;
  }

  _resolver(requestString, args, context, info) {
    const opts = httpOpts(this._options, args, context, info, {
      'content-type': 'application/json',
    });
    const body = {
      query: requestString,
      operationName: info.operation.name,
      variables: info.variableValues,
      raw: true,
    };
    return httpPOST(this._endpoint, body, opts).then(result => {
      if (result.errors) {
        throw new GraphQLError(result.errors.map(err => err.message));
      }
      return result.data[info.path.key];
    });
  }

  _introspect() {
    const opts = httpOpts(
      this._options,
      {},
      {},
      {},
      {
        'content-type': 'application/json',
      },
    );
    return httpPOST(this._endpoint, { query: introspectionQuery }, opts).then(
      result => {
        if (result.errors) {
          this.introspection = null;
          throw new GraphQLError('RemoteSchema failed introspection');
        }
        this._introspection = result.data;
      },
    );
  }
}
