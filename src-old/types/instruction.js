// @flow
// used to mark source for removal in directive reduction
export class GraphQLInstruction {
  description: string;
  constructor(description: string) {
    this.description = description;
  }
}

export class GraphQLSkipInstruction extends GraphQLInstruction {
  constructor(): void {
    super(
      'Instructs directive resolvers to ' +
        'omit a field or argument from the result',
    );
  }
}

export class GraphQLSkipResolveInstruction extends GraphQLInstruction {
  source: ?any;
  constructor(source?: ?any): void {
    super(
      'Instructs the factory execution to ' +
        'skip calling the field resolve function and instead ' +
        'use the provided source value as the result',
    );
    this.source = source;
  }
}

export class GraphQLOmitTraceInstruction extends GraphQLInstruction {
  source: ?any;
  constructor(source?: ?any): void {
    super('Omits a resolve from the execution tracing');
    this.source = source;
  }
}

export class GraphQLNextInstruction extends GraphQLInstruction {
  directive: string;
  source: ?any;
  constructor(directive: string, source?: ?any) {
    super('Executes the named directive next. Skips any that do not match');
    this.directive = directive;
    this.source = source;
  }
}
