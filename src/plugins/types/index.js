import Plugin from 'graphql-factory-plugin'
import FactoryBase64 from './Base64'
import FactoryDateTime from './DateTime'
import FactoryEmail from './Email'
import FactoryJSON from './JSON'
import FactoryURL from './URL'

export default class GraphQLFactoryTypesPlugin extends Plugin {
  constructor () {
    super(
      'GraphQLFactoryTypesPlugin',
      {},
      {},
      {
        Base64: FactoryBase64,
        DateTime: FactoryDateTime,
        Email: FactoryEmail,
        JSON: FactoryJSON,
        URL: FactoryURL
      },
      {}
    )
  }
}
