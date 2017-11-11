# GraphQL Factory Request Lifecycle `v1.0.0-alpha.0`

An outline of the graphql-factory request lifecycle specification

## Overview

First and foremost this document is a living document and subject to change until
the first official release at which time it will be versioned as such.

GraphQL Factory offers additional features on top of the native graphql-js library. 
The middleware/directive feature requires request data to be manipulated and processed
at different points in the request lifecycle. This necessitates the need for a well defined
lifecycle model with entry points that are easily accessible.

An example is a directive whose location is an input argument and function is to modify that
argument before the argument is used by the field resolve function. This requires that the
directive be applied `before` the resolve function is executed.

## Lifecycle

The lifecycle is not limited to execution time, it also includes schema generation.

**Lifecycle Events Overview**

1. `build` - during build
   * `beforeBuild`
   * `afterBuild`
   * `buildError`
2. `request`
   * `beforeRequest`
     * `query`
       1. `beforeQuery`
       2. `beforeResolve`
       3. **`resolve`**
       4. `afterResolve`
       5. `afterQuery`
     * `mutation`
       1. `beforeMutation`
       2. `beforeResolve`
       3. **`resolve`**
       3. `afterResolve`
       4. `afterMutation`
     * `subscription`
       1. `beforeSubscription`
       2. `subscriptionStart`
          1. **`resolve`**
          2. `subscriptionData`
       4. `subscriptionEnd`
   * `afterRequest`
   * `requestError` - error middleware is only executed on error and receives information on what point in the lifecycle the error was thrown
   
### Query Lifecycle Example

1. `beforeBuild`
2. `afterBuild`
3. `beforeQuery`
4. `beforeResolve`
5. **`resolve`**
6. `afterResolve`
7. `afterQuery`
