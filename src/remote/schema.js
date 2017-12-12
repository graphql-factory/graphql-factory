import {
  introspectionQuery,
  buildClientSchema,
  print,
  Kind,
  graphql
} from 'graphql';
import { getSelection } from '../utilities/info';
import { HttpClient } from '../utilities/http';
import _ from 'lodash';

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
    }
  });
}

export class RemoteSchema {
  constructor(options) {
    this._options = Object.assign({}, options);
    this.schema = null;
    this._resolve = {
      introspection: Promise.resolve()
    }
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
    })
  }

  resolver(source, args, context, info) {
    const selection = getSelection(info);
    const operation = _.cloneDeep(info.operation);
    operation.selectionSet.selections = [ selection ];
    const requestString = print(operation);
    return this._resolver(requestString, args, context, info);
  }

  introspect() {
    this._resolve.introspection = this._introspection ?
      Promise.resolve() :
      this._introspect();
    return this;
  }

  getIntrospection() {
    return this.introspect()._resolve.introspection.then(() => {
      return this._introspection;
    });
  }
}

export class RemoteSchemaHTTP extends RemoteSchema {
  constructor(endpoint, options) {
    super(options);
    this._endpoint = endpoint;
    this._client = new HttpClient(this._options);
  }

  _resolver(requestString, args, context, info) {
    // TODO: determine how to pass context, rootValue, variable values, etc.
    // content type application/json will allow variables, etc
    // from express-graphql - If context is not provided, the request 
    // object is passed as the context
    return this._client
    .post(this._endpoint, requestString, {
      headers: {
        'content-type': 'text/plain'
      }
    })
    .then(result => {
      return result.data[info.path.key];
    })
  }

  _introspect() {
    return this._client
      .post(this._endpoint, introspectionQuery, {
        headers: {
          'content-type': 'text/plain'
        }
      })
      .then(result => {
        if (result.errors) {
          this.introspection = null;
          throw new Error('RemoteSchema failed introspection');
        }
        this._introspection = result.data;
      })
  }
}