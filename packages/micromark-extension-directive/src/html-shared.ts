import type {
  CompileContext,
  Handle as MicromarkHandle
} from 'micromark-util-types'
import {ok as assert} from 'devlop'
import {parseEntities} from 'parse-entities'
import type {Directive, HtmlOptions} from './index.js'
import {EMPTY_OBJECT, pojo} from '@sequelize/utils'

// eslint-disable-next-line @typescript-eslint/unbound-method
export const own = Object.prototype.hasOwnProperty

export function enter(this: CompileContext, type: Directive['type']): void {
  let stack = this.getData('directiveStack')
  if (!stack) {
    this.setData('directiveStack', (stack = []))
  }

  stack.push({type, name: ''})
}

export const exitName: MicromarkHandle = function exitName(
  this: CompileContext,
  token
) {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack.at(-1)!.name = this.sliceSerialize(token)
}

export const enterLabel: MicromarkHandle = function enterLabel(
  this: CompileContext
) {
  this.buffer()
}

export const exitLabel: MicromarkHandle = function exitLabel(
  this: CompileContext
) {
  const data = this.resume()
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  stack.at(-1)!.label = data
}

export const enterAttributes: MicromarkHandle = function enterAttributes(
  this: CompileContext
) {
  this.buffer()
  this.setData('directiveAttributes', [])
}

export const exitAttributeIdValue: MicromarkHandle =
  function exitAttributeIdValue(this: CompileContext, token) {
    const attributes = this.getData('directiveAttributes')
    assert(attributes, 'expected attributes')
    attributes.push([
      'id',
      parseEntities(this.sliceSerialize(token), {
        attribute: true
      })
    ])
  }

export const exitAttributeClassValue: MicromarkHandle =
  function exitAttributeClassValue(this: CompileContext, token) {
    const attributes = this.getData('directiveAttributes')
    assert(attributes, 'expected attributes')

    attributes.push([
      'class',
      parseEntities(this.sliceSerialize(token), {
        attribute: true
      })
    ])
  }

export const exitAttributeName: MicromarkHandle = function exitAttributeName(
  this: CompileContext,
  token
) {
  // Attribute names in CommonMark are significantly limited, so character
  // references can't exist.
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')

  attributes.push([this.sliceSerialize(token), ''])
}

export const exitAttributeValue: MicromarkHandle = function exitAttributeValue(
  this: CompileContext,
  token
) {
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  attributes.at(-1)![1] = parseEntities(this.sliceSerialize(token), {
    attribute: true
  })
}

export const exitAttributes: MicromarkHandle = function exitAttributes(
  this: CompileContext
) {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  const attributes = this.getData('directiveAttributes')
  assert(attributes, 'expected attributes')
  const cleaned: Record<string, string> = pojo()
  let index = -1

  while (++index < attributes.length) {
    const attribute = attributes[index]

    if (attribute[0] === 'class' && cleaned.class) {
      cleaned.class += ` ${attribute[1]}`
    } else {
      cleaned[attribute[0]] = attribute[1]
    }
  }

  this.resume()
  this.setData('directiveAttributes')
  stack.at(-1)!.attributes = cleaned
}

export const exitContainerContent: MicromarkHandle =
  function exitContainerContent(this: CompileContext) {
    const data = this.resume()
    const stack = this.getData('directiveStack')
    assert(stack, 'expected directive stack')
    stack.at(-1)!.content = data
  }

export const exitContainerFence: MicromarkHandle = function exitContainerFence(
  this: CompileContext
) {
  const stack = this.getData('directiveStack')
  assert(stack, 'expected directive stack')
  const directive = stack.at(-1)!
  if (!directive._fenceCount) {
    directive._fenceCount = 0
  }

  directive._fenceCount++
  if (directive._fenceCount === 1) {
    this.setData('slurpOneLineEnding', true)
  }
}

export function createExit(
  options: HtmlOptions | undefined = EMPTY_OBJECT
): MicromarkHandle {
  return function exit(this: CompileContext): undefined {
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
