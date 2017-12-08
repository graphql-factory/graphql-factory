/**
 * Plugin for authentication and authorization
 * 
 * Strategy modeled after graphcool permission queries
 * 
 * This plugin will create a separate schema that it will
 * inject into each request. Directives will take advantage of
 * this schema to perform authN and authZ
 * 
 * It will provide 2 directives, one for authentication and
 * one for authorization.
 * 
 * Authentication directive should be provided an authenticate
 * resolver and return a valid userid on successful authentication
 * and null or errors if not authenticated
 */
import { directives } from './directive';

export default {
  directives
};
