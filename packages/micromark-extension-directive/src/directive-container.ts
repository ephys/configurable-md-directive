import type {
  Construct,
  State,
  Token,
  TokenizeContext,
  Tokenizer
} from 'micromark-util-types'
import {ok as assert} from 'devlop'
import {factorySpace} from 'micromark-factory-space'
import {markdownLineEnding} from 'micromark-util-character'
import {codes, constants, types} from 'micromark-util-symbol'
import {factoryAttributes} from './factory-attributes.js'
import {factoryLabel} from './factory-label.js'
import {factoryName} from './factory-name.js'

export const directiveContainer: Construct = {
  tokenize: tokenizeDirectiveContainer,
  concrete: true
}

const label: Construct = {tokenize: tokenizeLabel, partial: true}
const attributes: Construct = {tokenize: tokenizeAttributes, partial: true}
const nonLazyLine: Construct = {tokenize: tokenizeNonLazyLine, partial: true}

function tokenizeDirectiveContainer(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: Parameters<Tokenizer>[1],
  nok: Parameters<Tokenizer>[2]
): ReturnType<Tokenizer> {
  const tail = this.events[this.events.length - 1]
  const initialSize =
    tail && tail[1].type === types.linePrefix
      ? tail[2].sliceSerialize(tail[1], true).length
      : 0
  let sizeOpen = 0
  let previous: Token

  const sequenceOpen = (code: Parameters<State>[0]): ReturnType<State> => {
    if (code === codes.colon) {
      effects.consume(code)
      sizeOpen++
      return sequenceOpen
    }

    if (sizeOpen < constants.codeFencedSequenceSizeMin) {
      return nok(code)
    }

    effects.exit('directiveContainerSequence')
    return factoryName(
      this,
      effects,
      afterName,
      nok,
      'directiveContainerName'
    )(code)
  }

  const start = (code: Parameters<State>[0]): ReturnType<State> => {
    assert(code === codes.colon, 'expected `:`')
    effects.enter('directiveContainer')
    effects.enter('directiveContainerFence')
    effects.enter('directiveContainerSequence')
    return sequenceOpen(code)
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
    return factorySpace(effects, openAfter, types.whitespace)(code)
  }

  const openAfter = (code: Parameters<State>[0]): ReturnType<State> => {
    effects.exit('directiveContainerFence')

    if (code === codes.eof) {
      return after(code)
    }

    if (markdownLineEnding(code)) {
      if (this.interrupt) {
        return ok(code)
      }

      return effects.attempt(nonLazyLine, contentStart, after)(code)
    }

    return nok(code)
  }

  const contentStart = (code: Parameters<State>[0]): ReturnType<State> => {
    if (code === codes.eof) {
      return after(code)
    }

    if (markdownLineEnding(code)) {
      return effects.check(
        nonLazyLine,
        emptyContentNonLazyLineAfter,
        after
      )(code)
    }

    effects.enter('directiveContainerContent')
    return lineStart(code)
  }

  const lineStart = (code: Parameters<State>[0]): ReturnType<State> =>
    effects.attempt(
      {tokenize: tokenizeClosingFence, partial: true},
      afterContent,
      initialSize
        ? factorySpace(effects, chunkStart, types.linePrefix, initialSize + 1)
        : chunkStart
    )(code)

  const chunkStart = (code: Parameters<State>[0]): ReturnType<State> => {
    if (code === codes.eof) {
      return afterContent(code)
    }

    if (markdownLineEnding(code)) {
      return effects.check(nonLazyLine, chunkNonLazyStart, afterContent)(code)
    }

    return chunkNonLazyStart(code)
  }

  const contentContinue = (code: Parameters<State>[0]): ReturnType<State> => {
    if (code === codes.eof) {
      const t = effects.exit(types.chunkDocument)
      this.parser.lazy[t.start.line] = false
      return afterContent(code)
    }

    if (markdownLineEnding(code)) {
      return effects.check(nonLazyLine, nonLazyLineAfter, lineAfter)(code)
    }

    effects.consume(code)
    return contentContinue
  }

  const chunkNonLazyStart = (code: Parameters<State>[0]): ReturnType<State> => {
    const token = effects.enter(types.chunkDocument, {
      contentType: constants.contentTypeDocument,
      previous
    })
    if (previous) previous.next = token
    previous = token
    return contentContinue(code)
  }

  const emptyContentNonLazyLineAfter = (
    code: Parameters<State>[0]
  ): ReturnType<State> => {
    effects.enter('directiveContainerContent')
    return lineStart(code)
  }

  const nonLazyLineAfter = (code: Parameters<State>[0]): ReturnType<State> => {
    effects.consume(code)
    const t = effects.exit(types.chunkDocument)
    this.parser.lazy[t.start.line] = false
    return lineStart
  }

  const lineAfter = (code: Parameters<State>[0]): ReturnType<State> => {
    const t = effects.exit(types.chunkDocument)
    this.parser.lazy[t.start.line] = false
    return afterContent(code)
  }

  const afterContent = (code: Parameters<State>[0]): ReturnType<State> => {
    effects.exit('directiveContainerContent')
    return after(code)
  }

  const after = (code: Parameters<State>[0]): ReturnType<State> => {
    effects.exit('directiveContainer')
    return ok(code)
  }

  const tokenizeClosingFence = function (
    this: TokenizeContext,
    effects: Parameters<Tokenizer>[0],
    ok: Parameters<Tokenizer>[1],
    nok: Parameters<Tokenizer>[2]
  ): ReturnType<Tokenizer> {
    let size = 0
    assert(this.parser.constructs.disable.null, 'expected `disable.null`')
    return factorySpace(
      effects,
      closingPrefixAfter,
      types.linePrefix,
      this.parser.constructs.disable.null.includes('codeIndented')
        ? undefined
        : constants.tabSize
    )

    function closingPrefixAfter(code: Parameters<State>[0]): ReturnType<State> {
      effects.enter('directiveContainerFence')
      effects.enter('directiveContainerSequence')
      return closingSequence(code)
    }

    function closingSequence(code: Parameters<State>[0]): ReturnType<State> {
      if (code === codes.colon) {
        effects.consume(code)
        size++
        return closingSequence
      }

      if (size < sizeOpen) return nok(code)
      effects.exit('directiveContainerSequence')
      return factorySpace(effects, closingSequenceEnd, types.whitespace)(code)
    }

    function closingSequenceEnd(code: Parameters<State>[0]): ReturnType<State> {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit('directiveContainerFence')
        return ok(code)
      }

      return nok(code)
    }
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
    'directiveContainerLabel',
    'directiveContainerLabelMarker',
    'directiveContainerLabelString',
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
    'directiveContainerAttributes',
    'directiveContainerAttributesMarker',
    'directiveContainerAttribute',
    'directiveContainerAttributeId',
    'directiveContainerAttributeClass',
    'directiveContainerAttributeName',
    'directiveContainerAttributeInitializerMarker',
    'directiveContainerAttributeValueLiteral',
    'directiveContainerAttributeValue',
    'directiveContainerAttributeValueMarker',
    'directiveContainerAttributeValueData',
    true
  )
}

function tokenizeNonLazyLine(
  this: TokenizeContext,
  effects: Parameters<Tokenizer>[0],
  ok: Parameters<Tokenizer>[1],
  nok: Parameters<Tokenizer>[2]
): ReturnType<Tokenizer> {
  const lineStart = (code: Parameters<State>[0]): ReturnType<State> => {
    return this.parser.lazy[this.now().line] ? nok(code) : ok(code)
  }

  const start = (code: Parameters<State>[0]): ReturnType<State> => {
    assert(markdownLineEnding(code), 'expected eol')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return lineStart
  }

  return start
}
