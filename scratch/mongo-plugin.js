import mongoose from 'mongoose';
import {
  DirectiveLocation,
  getNamedType
} from 'graphql';
import {
  GraphQLFactoryPlugin,
  lodash as _,
  DependencyType,
  findAppliedDirective,
  dotPath
} from '../src';

const PLUGIN_NAME = 'mongoose';
const PLUGIN_VERSION = '0.1.0';
const SCALARS = [
  'ID',
  'Int',
  'Float',
  'String',
  'Boolean',
  'JSON',
  'DateTime'
];

/**
 * Translates a graphql scalar type to a valid mongoose type
 * @param {*} typeStr
 * @param {*} options
 */
function mongoType(
  typeStr,
  options
) {
  const required = typeStr.match(/^(\S+)!$/);
  const list = typeStr.match(/^\[(\S+)]$/);

  if (required) {
    const innerType = required[1];
    if (_.includes(SCALARS, innerType)) {
      options.required = true;
    }
    return mongoType(innerType);
  } else if (list) {
    return [ mongoType(list[1]) ];
  }
  switch (typeStr) {
    case 'String':
      return String;
    case 'Int':
    case 'Float':
      return Number;
    case 'Boolean':
      return Boolean;
    case 'DateTime':
      return Date;
    case 'ID':
      return mongoose.Schema.Types.ObjectId;
    case 'JSON':
      return mongoose.Schema.Types.Mixed;
    default:
      throw new Error(typeStr);
  }
}

export default class MongoosePlugin extends GraphQLFactoryPlugin {
  constructor(connections) {
    super(PLUGIN_NAME, PLUGIN_VERSION);

    if (!_.isObject(connections)) {
      throw new Error('Invalid Connection or ConnectionMap passed to pluggin');
    } else if (_.isPlainObject(connections)) {
      if (!_.keys(connections).length) {
        throw new Error('Empty ConnectionMap. ' +
        'At least one connection required');
      }
      this.connections = connections;
    } else {
      this.connections = { default: connections };
    }
    this.defaultConnection = this.connections[_.keys(this.connections)[0]];
    this.models = {};
    this.addDependency(DependencyType.DIRECTIVE, 'resolve');
    this.addDependency(DependencyType.DIRECTIVE, 'unique');
    this.addDependency(DependencyType.DIRECTIVE, 'id');
    // this.addDependency(DependencyType.DIRECTIVE, 'relation');
    this.addDependency(DependencyType.TYPE, 'JSON');
    this.addDependency(DependencyType.TYPE, 'DateTime');

    this._directives = {
      relation: {
        name: 'relation',
        description: 'Identifies a relationship/association. See ' +
        'https://github.com/graphql-factory/graphql-factory/wiki/Relations',
        locations: [
          DirectiveLocation.FIELD_DEFINITION
        ],
        args: {
          type: { type: 'String!' },
          field: { type: 'String!' },
          key: { type: 'String' }
        }
      },
      mongoose: {
        name: 'mongoose',
        description: 'Creates the object as a Mongoose model',
        locations: [
          DirectiveLocation.OBJECT
        ],
        args: {
          collection: {
            type: 'String',
            description: 'The name of the collection to map the type to. ' +
            'Must be specified for root and nested object types that ' +
            'are used in fields with resolvers'
          },
          connection: {
            type: 'String',
            description: 'The Mongoose connection name to use for the ' +
            'schema/model. Should only be used when specifying a ' +
            'ConnectionMap to the plugin during setup. If omitted when ' +
            'using a ConnectionMap, the first connection will be used'
          }
        },
        build: (source, args, context, info) => {
          const collection = _.get(args, 'collection') || info.sourceName;
          const connName = _.get(args, 'connection');
          let virtualID = null;
          let hasID = null;

          const connection = connName ?
            _.get(this.connections, [ connName ]) :
            this.defaultConnection;

          if (!connection) {
            throw new Error('No Mongoose connection found for ' +
            info.sourceName);
          }

          // construct the schema config
          const config = _.reduce(source.fields, (accum, def, name) => {
            const idDir = findAppliedDirective(def, 'id');
            if (_.get(idDir, 'args') && name !== '_id') {
              virtualID = name;
              hasID = true;
              return accum;
            }
            if (name === '_id') {
              hasID = true;
              return accum;
            }
            try {
              const option = {};
              const type = mongoType(def.type, option);
              accum[name] = { type };

              if (option.required) {
                accum[name].required = true;
              }
              if (_.get(def, [ '@directives', 'unique' ])) {
                accum[name].unique = true;
              }

              // console.log(name, type, option);
            } catch (err) {
              console.log('Custom type', err.message);
              accum[name] = { type: String };
            }
            // console.log({ name, def });
            return accum;
          }, {});

          // check that an id field was specified
          if (!hasID) {
            throw new Error('No Mongoose ID field was found for type ' +
            info.sourceName + '. Either an _id field or @id directive ' +
            'on the field containing the ID need to be configured');
          }

          const modelSchema = new mongoose.Schema(config, {
            collection
          });

          // handle virtual id for models since we dont always
          // want to use _id as the id field in our graphql type
          if (virtualID) {
            modelSchema.virtual(virtualID).get(function () {
              return this._id;
            });
            modelSchema.virtual(virtualID).set(function (id) {
              this._id = id;
            });
          }

          this.models[info.sourceName] = connection.model(
            info.sourceName,
            modelSchema
          );
        }
      }
    };

    this._functions = {
      mongooseRelationResolver: (source, args, context, info) => {
        if (!info.path.prev) {
          info.schema.definition.emit(
            'warn',
            '[plugin-mongoose]: mongooseRelationResolver was placed ' +
            'on a root field located at ' + dotPath(info.path)
          );
          return null;
        }
        // console.log(dotPath(info.path), info.fieldName);
        return { id: 'blah', name: 'blah' };
      },
      mongooseFindOneResolver: (source, args, context, info) => {
        const Model = this.models[info.returnType.name];
        return Model.findOne(args.filter);
      },
      mongooseFindManyResolver: (source, args, context, info) => {
        const namedType = getNamedType(info.returnType);
        const Model = this.models[namedType.name];
        return Model.find(args.filter);
      },
      mongooseCreateOneResolver: (source, args, context, info) => {
        const Model = this.models[info.returnType.name];
        const NewModel = new Model(args);
        return NewModel.save();
      },
      mongooseCreateManyResolver: (source, args, context, info) => {
        const namedType = getNamedType(info.returnType);
        const Model = this.models[namedType.name];
        return Model.insertMany(args.documents);
      },
      mongooseUpdateOneResolver: (source, args, context, info) => {
        const Model = this.models[info.returnType.name];
        return Model.findOneAndUpdate(args.filter, args.document, {
          new: true
        });
      }
    };
  }
}
