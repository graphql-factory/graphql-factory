export const DEFINITION_FIELDS = [
  'context',
  'functions',
  'directives',
  'types',
  // schema needs to remain last because conflict resolution
  // uses this array to resolve conflicts and all type conflicts
  // should be resolved before schema conflicts
  'schema'
];

export const EventType = {
  EXECUTION: 'execution',
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info'
};

export const ConflictResolution = {
  MERGE: 'merge', // merges the source into target
  REPLACE: 'replace', // replaces target with source
  SKIP: 'skip', // no action, target remains unmodified
  ERROR: 'error', // throw an error
  WARN: 'warn', // use the default resolution resolver and emit a warning
  DEFAULT: 'default' // use the default resolution resolver
};
