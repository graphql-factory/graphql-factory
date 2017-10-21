import FactoryBase64 from './Base64'
import FactoryDateTime from './DateTime'
import FactoryEmail from './Email'
import FactoryJSON from './JSON'
import FactoryURL from './URL'

export default {
  name: 'FactoryTypes',
  types: {
    Base64: FactoryBase64,
    DateTime: FactoryDateTime,
    Email: FactoryEmail,
    JSON: FactoryJSON,
    URL: FactoryURL
  }
}
