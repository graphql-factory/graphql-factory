Plugins
=======

Plugins extend a graphql factory definition with additional types, schemas, functions, global values, and middleware.
They are essentially definitions that are merged into the main definition and have an optional ``install`` function
that gives access to the definition to add middleware ::

    const MyPlugin = {
        types: {
            MyType: {
                fields: {
                    id: { type: 'ID', nullable: false },
                    foo: { type: 'String' }
                }
            }
        },
        install (definition) {
            definition.beforeMiddleware(
                function (params, next) {
                    // do something
                    return next()
                }
            )
        }
    }

