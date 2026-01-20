import type {
  Construct,
  Previous,
  State,
  TokenizeContext,
  Tokenizer
} from 'micromark-util-types'
import {ok as assert} from 'devlop'
import {codes, types} from 'micromark-util-symbol'
import {factoryAttributes} from './factory-attributes.js'
import {factoryLabel} from './factory-label.js'
import {factoryName} from './factory-name.js'

export const directiveText: Construct = {
  tokenize: tokenizeDirectiveText,
  previous
}

const label: Construct = {tokenize: tokenizeLabel, partial: true}
const attributes: Construct = {tokenize: tokenizeAttributes, partial: true}

function previous(
  this: TokenizeContext,
  code: Parameters<Previous>[0]
): ReturnType<Previous> {
  // If there is a previous code, there will always be a tail.
  return (
    code !== codes.colon ||
    this.events[this.events.length - 1][1].type === types.characterEscape
  )
}

function tokenizeDirectiveText(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: Parameters<Tokenizer>[1],
  nok: Parameters<Tokenizer>[2]
): ReturnType<Tokenizer> {
  const start = (code: Parameters<State>[0]): ReturnType<State> => {
    assert(code === codes.colon, 'expected `:`')
    assert(previous.call(this, this.previous), 'expected correct previous')
    effects.enter('directiveText')
    effects.enter('directiveTextMarker')
    effects.consume(code)
    effects.exit('directiveTextMarker')
    return factoryName(this, effects, afterName, nok, 'directiveTextName')
  }

  const afterName = (code: Parameters<State>[0]): ReturnType<State> => {
    return code === codes.colon
      ? nok(code)
      : code === codes.leftSquareBracket
        ? effects.attempt(label, afterLabel, afterLabel)(code)
        : afterLabel(code)
  }

  const afterLabel = (code: Parameters<State>[0]): ReturnType<State> => {
    return code === codes.leftCurlyBrace
      ? effects.attempt(attributes, afterAttributes, afterAttributes)(code)
      : afterAttributes(code)
  }

  const afterAttributes = (code: Parameters<State>[0]): ReturnType<State> => {
    effects.exit('directiveText')
    return ok(code)
  }

  return start
}

function tokenizeLabel(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: Parameters<Tokenizer>[1],
  nok: Parameters<Tokenizer>[2]
): ReturnType<Tokenizer> {
  // Always a `[`
  return factoryLabel(
    effects,
    ok,
    nok,
    'directiveTextLabel',
    'directiveTextLabelMarker',
    'directiveTextLabelString'
  )
}

function tokenizeAttributes(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: Parameters<Tokenizer>[1],
  nok: Parameters<Tokenizer>[2]
): ReturnType<Tokenizer> {
  // Always a `{`
  return factoryAttributes(
    effects,
    ok,
    nok,
    'directiveTextAttributes',
    'directiveTextAttributesMarker',
    'directiveTextAttribute',
    'directiveTextAttributeId',
    'directiveTextAttributeClass',
    'directiveTextAttributeName',
    'directiveTextAttributeInitializerMarker',
    'directiveTextAttributeValueLiteral',
    'directiveTextAttributeValue',
    'directiveTextAttributeValueMarker',
    'directiveTextAttributeValueData'
  )
}
