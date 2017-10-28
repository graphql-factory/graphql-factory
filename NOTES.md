# Notes

## Request context

* All plugin context and definition context is merged with the request `context`. This
differs from v2 where the context was available via `this`. This change was made to allow
arrow functions as resolvers

* `context.resolverTimeout` can be set to an integer in ms for the resolver function to timeout.
By default the value is `0` which means no timeout

* `context.requestTimeout` can be set to an integer in ms for a timeout on the entire request.
By default the value is `0` which means no timeout


## Build Flow

New factory Created `>` 
Factory Chain created `>` 
Definition created and passed Factory Chain `>`
library called `>`
Definition updated based on options `>`
Generator created

## References

* FactoryChain `refs` Definition
* Definition `refs` FactoryChain
* Generator `refs` Definition, Library
