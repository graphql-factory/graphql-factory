# Directives Implementation

Since the directive's implementation is mostly left to the developer, this document
attempts to outline the implementation approach for GraphQL Factory

## Middleware

The base `GraphQLDirective` object given a Backing field `_factory` which contains
Middleware and conflict resolution data. Middleware allows custom code to run at certain
points in the build/request lifecycle with targeted data.

#### Lifecycle Hooks

There are middleware hooks for each part of the [`Lifecycle`](LIFECYCLE.md) and the
allowed hooks are based on the Directive's configured `locations`.

This ensures that `beforeResolve` middleware is not called during the build process 
or `beforeQuery` middleware is not called during a mutation operation, etc. 
This also allows a directive to execute different procedures based on where the 
request is currently at in the lifecycle.

#### Directive Reduction

Since the number of directives is not limited, and building the schema from a definition
does not appear to currently do a location validation, directive reduction takes place
to filter out the allowed and appropriate directives to apply based on the current location
and placement.

#### Conflict Resolution

At a high level, there are two places directives can be applied. First is on the definition
of the schema and its members. Second is on the request/operation. Because the same directive
may potentially be applied on the definition and on the operation there must be a way to 
determine which directive + arguments should be applied.

To do this, a conflict property is added to the directive and it's value can allow the 
operation's value to take precedence, the definitions value to take precedence, an error
to be thrown, a warning to be logged, or the arguments to be merged.

By default, the operation directive has precedence

Why is this useful? Imagine you have a directive that you want to set on some objects but not all
and allow the user to specify a value for that directive on the objects that do not have the
directive defined on them while still enforcing that the ones that do are not changed. This
requires you to allow the directive in both the definition and the operation. With conflict
resolution you can safely mark the directive with a `definition` conflict resolution and 
the definition will remain unmodified.

#### Scopes & Contexts

A major advantage to directives is that you are able to modify data before you send it along,
but all data should not be accessible to all directives. Directives should instead have an
identified scope

Take the example of a directive placed on an argument. The directive modifies the argument 
in some way before it is used in a resolve function. Because the directive is placed on 
the argument, you would only want it to access and modify that specific argument. These
requirements make up the directives scope which say "at these lifecycle hooks on these
locations this is what can be read/updated"
