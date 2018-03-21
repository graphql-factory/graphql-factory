import {
  GraphQLError,
  introspectionQuery,
  buildClientSchema,
  print,
} from 'graphql';
import { getSelection, httpPOST } from '../utilities';
import { lodash as _ } from '../jsutils';

function proxyRemoteFields(type) {
  if (
    typeof type !== 'object' ||
    type === null ||
    typeof type.getFields !== 'function'
  ) {
    return;
  }
  const fields = type.getFields();
  Object.keys(fields).forEach(field => {
    fields[field].resolve = (...args) => {
      return this.resolver(...args);
    };
  });
}

export class RemoteSchema {
  constructor(options) {
    this._options = Object.assign({}, options);
    this.schema = null;
    this._resolve = {
      introspection: Promise.resolve(),
    };
    this._introspection = this._options.introspection;
  }

  buildSchema() {
    return this.getIntrospection().then(introspection => {
      const schema = buildClientSchema(introspection);
      proxyRemoteFields.call(this, schema._queryType);
      proxyRemoteFields.call(this, schema._mutationType);
      proxyRemoteFields.call(this, schema._subscriptionType);
      this.schema = schema;
      return schema;
    });
  }

  resolver(source, args, context, info) {
    const selection = getSelection(info);
    const operation = _.cloneDeep(info.operation);
    operation.selectionSet.selections = [selection];
    const requestString = print(operation);
    return this._resolver(requestString, args, context, info);
  }

  introspect() {
    this._resolve.introspection = this._introspection
      ? Promise.resolve()
      : this._introspect();
    return this;
  }

  getIntrospection() {
    return this.introspect()._resolve.introspection.then(() => {
      return this._introspection;
    });
  }
}

function httpOpts(options, args, context, info, headers) {
  return _.merge(
    {},
    _.isFunction(options) ? options({ args, context, info }) : options,
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
          throw new Error('RemoteSchema failed introspection');
        }
        this._introspection = result.data;
      },
    );
  }
}
