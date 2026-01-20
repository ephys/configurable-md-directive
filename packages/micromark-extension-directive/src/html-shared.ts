import type {
  CompileContext,
  Handle as MicromarkHandle
} from 'micromark-util-types'
import {ok as assert} from 'devlop'
import {parseEntities} from 'parse-entities'
import type {Directive, HtmlOptions} from './index.js'

export const own = {}.hasOwnProperty

type AttributeTuple = [key: string, value: string]

export function enter(this: CompileContext, type: Directive['type']): void {
  let stack = this.getData('directiveStack')
  if (!stack) this.setData('directiveStack', (stack = []))
  stack.push({type, name: ''})
}

export const exitName: MicromarkHandle = function (
  this: CompileContext,
  token
) {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack[stack.length - 1].name = this.sliceSerialize(token)
}

export const enterLabel: MicromarkHandle = function (this: CompileContext) {
  this.buffer()
}

export const exitLabel: MicromarkHandle = function (this: CompileContext) {
  const data = this.resume()
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack[stack.length - 1].label = data
}

export const enterAttributes: MicromarkHandle = function (
  this: CompileContext
) {
  this.buffer()
  this.setData('directiveAttributes', [])
}

export const exitAttributeIdValue: MicromarkHandle = function (
  this: CompileContext,
  token
) {
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  attributes.push([
    'id',
    parseEntities(this.sliceSerialize(token), {
      attribute: true
    })
  ])
}

export const exitAttributeClassValue: MicromarkHandle = function (
  this: CompileContext,
  token
) {
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')

  attributes.push([
    'class',
    parseEntities(this.sliceSerialize(token), {
      attribute: true
    })
  ])
}

export const exitAttributeName: MicromarkHandle = function (
  this: CompileContext,
  token
) {
  // Attribute names in CommonMark are significantly limited, so character
  // references can't exist.
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')

  attributes.push([this.sliceSerialize(token), ''])
}

export const exitAttributeValue: MicromarkHandle = function (
  this: CompileContext,
  token
) {
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  attributes[attributes.length - 1][1] = parseEntities(
    this.sliceSerialize(token),
    {attribute: true}
  )
}

export const exitAttributes: MicromarkHandle = function (this: CompileContext) {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  const cleaned: Record<string, string> = {}
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

export const exitContainerContent: MicromarkHandle = function (
  this: CompileContext
) {
  const data = this.resume()
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack[stack.length - 1].content = data
}

export const exitContainerFence: MicromarkHandle = function (
  this: CompileContext
) {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  const directive = stack[stack.length - 1]
  if (!directive._fenceCount) directive._fenceCount = 0
  directive._fenceCount++
  if (directive._fenceCount === 1) this.setData('slurpOneLineEnding', true)
}

export function createExit(options: HtmlOptions): MicromarkHandle {
  return function (this: CompileContext): undefined {
    const stack = this.getData('directiveStack')
    assert(stack, 'expected directive stack')
    const directive = stack.pop()
    assert(directive, 'expected directive')
    let found: boolean | undefined
    let result: boolean | undefined

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
