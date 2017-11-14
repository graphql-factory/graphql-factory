// @flow
// used to mark source for removal in directive reduction
export class GraphQLSkipInstruction {
  constructor (): void {
    this.description = 'Instructs directive resolvers to ' +
      'omit a field or argument from the result'
  }
};
