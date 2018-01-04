# TODO

### Conflict resolution

* Add field and type level conflict resolution. Should supply either a method or function. Add support for default conflict resolver for this
* Ignore type extension in default conflict resolver function

### Definition

* Definition validation
* add type extensions support
* investigate introspection query or create something more simple and add it as a default query in the built factory definition. This may make it easier to query remote schemas built with graphql-factory for their schema ast

### Print

* add type extension printing

### Execution

* fragment support including directives, etc - MOSTLY DONE, need to determine the attachInfo for fragments
  
* determine what directive locations are still remaining to be implemented

### Directives

* build out auth directive.

### Remote schemas

* add out of the box support for building executable remote schemas

### Tests

* Write them
