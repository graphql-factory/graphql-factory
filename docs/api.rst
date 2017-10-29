.. _API:

====
API
====

.. index:: GraphQLFactory

``GraphQLFactory`` instance
+++++++++++++++++++++++++++

GraphQLFactory requires graphql to be passed as its only parameter to create a factory instance::

    const factory = GraphQLFactory(graphql)

.. hint::

    When using ``import`` to load ``graphql`` all exports should be imported with ``import * as graphql from 'graphql'``

``factory`` prototype
+++++++++++++++++++++

The factory prototype is used to create a library

.. _factory_make:

.. index:: Make

``make()``
-------------------------------------------------------------------------------

**Signature:** ``make(Object definition [, Object options])``

Creates a new library ::

    factory.make(definition, {
        plugin: [
            new TypesPlugin(),
            new SubscriptionPlugin()
        ],
        beforeMiddleware: [
            function (params, next) {
                const { source, args, context, info } = params
                args.before = true
                return next()
            }
        ],
        afterMiddleware: [
            function (params, result, next) {
                result.after = true
                return next(result)
            }
        ]
    })


**Options**

- ``compile`` When **false** skips the compile process
- ``plugin`` Array of plugins
- ``beforeMiddleware`` Array of before middleware
- ``afterMiddleWare`` Array of after middleware
- ``beforeTimeout`` Timeout for all before middleware to complete
- ``afterTimeout`` Timeout for all after middleware to complete

**Returns** ``GraphQLFactoryLibrary``

.. index:: GraphQLFactoryLibrary

``GraphQLFactoryLibrary`` instance
++++++++++++++++++++++++++++++++++

The GraphQLFactoryLibrary prototype is used to make graphql requests and access the definition. Each schema
in the definition will have its own method in the library

.. _factory_library:

.. index:: Library

``<schemaName>()``
-------------------------------------------------------------------------------

**Signature:** ``<schemaName>(String request [, Object root, Object context, Object variables, String operation])``

Makes a new graphql request ::

    lib.Users(`
        query Query {
            listUsers {
                id
                name
                email
            }
        }
    `)

**Options:**

- ``request`` graphql requestString
- ``root`` graphql rootValue
- ``context`` graphql context
- ``variables`` graphql variableValues
- ``operation`` graphql operationName

