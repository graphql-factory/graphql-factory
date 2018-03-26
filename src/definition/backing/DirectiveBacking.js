// @flow
import { set } from '../../jsutils/lodash.custom';
import { TypeBacking } from './TypeBacking';
import { SchemaBacking } from './SchemaBacking';
import { assert } from './utils';

function setBacking(name, func) {
  assert(typeof func === 'function', `${name} must be a function`);
  set(this._backing, ['_directives', this._name, 'middleware', name], func);
  return this;
}

export class DirectiveBacking extends TypeBacking {
  constructor(backing: SchemaBacking, name: string) {
    super(backing, name);
  }
  visitQueryNode(func) {
    return setBacking.call(this, 'visitQueryNode', func);
  }
  beforeQuery(func) {
    return setBacking.call(this, 'beforeQuery', func);
  }
  afterQuery(func) {
    return setBacking.call(this, 'afterQuery', func);
  }
  visitMutationNode(func) {
    return setBacking.call(this, 'visitMutationNode', func);
  }
  beforeMutation(func) {
    return setBacking.call(this, 'beforeMutation', func);
  }
  afterMutation(func) {
    return setBacking.call(this, 'afterMutation', func);
  }
  visitSubscriptionNode(func) {
    return setBacking.call(this, 'visitSubscriptionNode', func);
  }
  beforeSubscription(func) {
    return setBacking.call(this, 'beforeSubscription', func);
  }
  afterSubscription(func) {
    return setBacking.call(this, 'afterSubscription', func);
  }
  visitFieldNode(func) {
    return setBacking.call(this, 'visitFieldNode', func);
  }
  beforeField(func) {
    return setBacking.call(this, 'beforeField', func);
  }
  afterField(func) {
    return setBacking.call(this, 'afterField', func);
  }
  visitFragmentDefinitionNode(func) {
    return setBacking.call(this, 'visitFragmentDefinitionNode', func);
  }
  visitFragmentSpreadNode(func) {
    return setBacking.call(this, 'visitFragmentSpreadNode', func);
  }
  visitInlineFragmentNode(func) {
    return setBacking.call(this, 'visitInlineFragmentNode', func);
  }
  visitSchema(func) {
    return setBacking.call(this, 'visitSchema', func);
  }
  visitSchemaNode(func) {
    return setBacking.call(this, 'visitSchemaNode', func);
  }
  beforeSchema(func) {
    return setBacking.call(this, 'beforeSchema', func);
  }
  afterSchema(func) {
    return setBacking.call(this, 'afterSchema', func);
  }
  visitScalar(func) {
    return setBacking.call(this, 'visitScalar', func);
  }
  visitScalarNode(func) {
    return setBacking.call(this, 'visitScalarNode', func);
  }
  visitObject(func) {
    return setBacking.call(this, 'visitObject', func);
  }
  visitObjectNode(func) {
    return setBacking.call(this, 'visitObjectNode', func);
  }
  visitFieldDefinition(func) {
    return setBacking.call(this, 'visitFieldDefinition', func);
  }
  visitFieldDefinitionNode(func) {
    return setBacking.call(this, 'visitFieldDefinitionNode', func);
  }
  beforeFieldDefinition(func) {
    return setBacking.call(this, 'beforeFieldDefinition', func);
  }
  afterFieldDefinition(func) {
    return setBacking.call(this, 'afterFieldDefinition', func);
  }
  visitArgumentDefinition(func) {
    return setBacking.call(this, 'visitArgumentDefinition', func);
  }
  visitArgumentDefinitionNode(func) {
    return setBacking.call(this, 'visitArgumentDefinitionNode', func);
  }
  visitInterface(func) {
    return setBacking.call(this, 'visitInterface', func);
  }
  visitInterfaceNode(func) {
    return setBacking.call(this, 'visitInterfaceNode', func);
  }
  visitUnion(func) {
    return setBacking.call(this, 'visitUnion', func);
  }
  visitUnionNode(func) {
    return setBacking.call(this, 'visitUnionNode', func);
  }
  visitEnum(func) {
    return setBacking.call(this, 'visitEnum', func);
  }
  visitEnumNode(func) {
    return setBacking.call(this, 'visitEnumNode', func);
  }
  visitEnumValue(func) {
    return setBacking.call(this, 'visitEnumValue', func);
  }
  visitEnumValueNode(func) {
    return setBacking.call(this, 'visitEnumValueNode', func);
  }
  visitInputObject(func) {
    return setBacking.call(this, 'visitInputObject', func);
  }
  visitInputObjectNode(func) {
    return setBacking.call(this, 'visitInputObjectNode', func);
  }
  visitInputFieldDefinition(func) {
    return setBacking.call(this, 'visitInputFieldDefinition', func);
  }
  visitInputFieldDefinitionNode(func) {
    return setBacking.call(this, 'visitInputFieldDefinitionNode', func);
  }
}
