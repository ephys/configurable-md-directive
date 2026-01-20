/**
 * @import {Directive, HtmlOptions} from '@ephys/micromark-extension-directive'
 * @import {CompileContext, Handle as MicromarkHandle} from 'micromark-util-types'
 */

import {ok as assert} from 'devlop'
import {parseEntities} from 'parse-entities'

export const own = {}.hasOwnProperty

/**
 * @this {CompileContext}
 * @param {Directive['type']} type
 */
export function enter(type) {
  let stack = this.getData('directiveStack')
  if (!stack) this.setData('directiveStack', (stack = []))
  stack.push({type, name: ''})
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitName(token) {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack[stack.length - 1].name = this.sliceSerialize(token)
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function enterLabel() {
  this.buffer()
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitLabel() {
  const data = this.resume()
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack[stack.length - 1].label = data
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function enterAttributes() {
  this.buffer()
  this.setData('directiveAttributes', [])
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitAttributeIdValue(token) {
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  attributes.push([
    'id',
    parseEntities(this.sliceSerialize(token), {
      attribute: true
    })
  ])
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitAttributeClassValue(token) {
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')

  attributes.push([
    'class',
    parseEntities(this.sliceSerialize(token), {
      attribute: true
    })
  ])
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitAttributeName(token) {
  // Attribute names in CommonMark are significantly limited, so character
  // references can't exist.
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')

  attributes.push([this.sliceSerialize(token), ''])
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitAttributeValue(token) {
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  attributes[attributes.length - 1][1] = parseEntities(
    this.sliceSerialize(token),
    {attribute: true}
  )
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitAttributes() {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  /** @type {Record<string, string>} */
  const cleaned = {}
  let index = -1

  while (++index < attributes.length) {
    const attribute = attributes[index]

    if (attribute[0] === 'class' && cleaned.class) {
      cleaned.class += ' ' + attribute[1]
    } else {
      cleaned[attribute[0]] = attribute[1]
    }
  }

  this.resume()
  this.setData('directiveAttributes')
  stack[stack.length - 1].attributes = cleaned
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitContainerContent() {
  const data = this.resume()
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack[stack.length - 1].content = data
}

/**
 * @this {CompileContext}
 * @type {MicromarkHandle}
 */
export function exitContainerFence() {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  const directive = stack[stack.length - 1]
  if (!directive._fenceCount) directive._fenceCount = 0
  directive._fenceCount++
  if (directive._fenceCount === 1) this.setData('slurpOneLineEnding', true)
}

/**
 * @param {HtmlOptions} options
 * @returns {MicromarkHandle}
 */
export function createExit(options) {
  /**
   * @this {CompileContext}
   */
  return function () {
    const stack = this.getData('directiveStack')
    assert(stack, 'expected directive stack')
    const directive = stack.pop()
    assert(directive, 'expected directive')
    /** @type {boolean | undefined} */
    let found
    /** @type {boolean | undefined} */
    let result

    assert(directive.name, 'expected `name`')

    if (own.call(options, directive.name)) {
      result = options[directive.name].call(this, directive)
      found = result !== false
    }

    if (!found && own.call(options, '*')) {
      result = options['*'].call(this, directive)
      found = result !== false
    }

    if (!found && directive.type !== 'textDirective') {
      this.setData('slurpOneLineEnding', true)
    }
  }
}
