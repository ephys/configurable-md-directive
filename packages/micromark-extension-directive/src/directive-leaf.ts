import type {
  Construct,
  State,
  TokenizeContext,
  Tokenizer
} from 'micromark-util-types'
import {ok as assert} from 'devlop'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes, types} from 'micromark-util-symbol'
import {factoryAttributes} from './factory-attributes.js'
import {factoryLabel} from './factory-label.js'
import {factoryName} from './factory-name.js'

export const directiveLeaf: Construct = {tokenize: tokenizeDirectiveLeaf}

const label: Construct = {tokenize: tokenizeLabel, partial: true}
const attributes: Construct = {tokenize: tokenizeAttributes, partial: true}

function tokenizeDirectiveLeaf(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: Parameters<Tokenizer>[1],
  nok: Parameters<Tokenizer>[2]
): ReturnType<Tokenizer> {
  const start = (code: Parameters<State>[0]): ReturnType<State> => {
    assert(code === codes.colon, 'expected `:`')
    effects.enter('directiveLeaf')
    effects.enter('directiveLeafSequence')
    effects.consume(code)
    return inStart
  }

  const inStart = (code: Parameters<State>[0]): ReturnType<State> => {
    if (code === codes.colon) {
      effects.consume(code)
      effects.exit('directiveLeafSequence')
      return factoryName(this, effects, afterName, nok, 'directiveLeafName')
    }

    return nok(code)
  }

  const afterName = (code: Parameters<State>[0]): ReturnType<State> => {
    return code === codes.leftSquareBracket
      ? effects.attempt(label, afterLabel, afterLabel)(code)
      : afterLabel(code)
  }

  const afterLabel = (code: Parameters<State>[0]): ReturnType<State> => {
    return code === codes.leftCurlyBrace
      ? effects.attempt(attributes, afterAttributes, afterAttributes)(code)
      : afterAttributes(code)
  }

  const afterAttributes = (code: Parameters<State>[0]): ReturnType<State> => {
    return factorySpace(effects, end, types.whitespace)(code)
  }

  const end = (code: Parameters<State>[0]): ReturnType<State> => {
    if (code === codes.eof || markdownLineEnding(code)) {
      effects.exit('directiveLeaf')
      return ok(code)
    }

    return nok(code)
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
    'directiveLeafLabel',
    'directiveLeafLabelMarker',
    'directiveLeafLabelString',
    true
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
    'directiveLeafAttributes',
    'directiveLeafAttributesMarker',
    'directiveLeafAttribute',
    'directiveLeafAttributeId',
    'directiveLeafAttributeClass',
    'directiveLeafAttributeName',
    'directiveLeafAttributeInitializerMarker',
    'directiveLeafAttributeValueLiteral',
    'directiveLeafAttributeValue',
    'directiveLeafAttributeValueMarker',
    'directiveLeafAttributeValueData',
    true
  )
}
