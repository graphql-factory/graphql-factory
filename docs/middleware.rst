Middleware
==========

Middleware in graphql-factory is used to wrap resolver functions in global functions. These functions can
be run before or after the resolver. These functions can both modify arguments before the resolver is run
or modify results after.

**Example** ::

    const lib = factory.make(definition, {
        beforeResolve: [
            function (args, next) {
                // first before middleware
                next()
            },
            function (args, next) {
                // second before middleware
                next()
            }
        ],
        afterResolve: [
            function (args, result, next) {
                // first after middleware, modify prop1
                result.prop1 = null
                next(result)
            },
            function (args, result, next) {
                // second after middleware
                next()
            }
        ],
        beforeTimeout: 10000,
        afterTimeout: 2000
    })

