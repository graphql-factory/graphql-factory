# TODO

### Directive Location Middleware

**Remaining**

Where are these applied and what do they do?

  * FRAGMENT_DEFINITION
  * FRAGMENT_SPREAD
  * INLINE_FRAGMENT
  * ARGUMENT_DEFINITION
  * ENUM_VALUE
  * INPUT_OBJECT
  * INPUT_FIELD_DEFINITION

**Partially Completed**
  * SCALAR
    * when run on each field during executeFields
      * request source is fieldDefinition
      * result source is field result
  * OBJECT
    * when run on each field during executeFields
      * request source is fieldDefinition
      * result source is field result
  * INTERFACE
    * when run on each field during executeFields
      * request source is fieldDefinition
      * result source is field result
  * UNION
    * when run on each field during executeFields
      * request source is fieldDefinition
      * result source is field result
  * ENUM
    * when run on each field during executeFields
      * request source is fieldDefinition
      * result source is field result

**Completed**
  * SCHEMA
    * run during executeOperation
    * request source is schema
    * result source is result
  * QUERY
    * run during executeOperation
    * request source is schema
    * result source is result
  * MUTATION
    * run during executeOperation
    * request source is schema
    * result source is result
  * SUBSCRIPTION
    * run during executeOperation
    * request source is schema
    * result source is result
  * FIELD
    * run on each field during executeFields
    * request source is fieldDefinition
    * result source is field result
  * FIELD_DEFINITION
    * when run on each field during executeFields
      * request source is fieldDefinition
      * result source is field result
