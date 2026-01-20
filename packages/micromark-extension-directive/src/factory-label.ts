import type {Code, Effects, State, Token, TokenType} from 'micromark-util-types'
import {ok as assert} from 'devlop'
import {markdownLineEnding} from 'micromark-util-character'
import {codes, constants, types} from 'micromark-util-symbol'

// This is a fork of:
// <https://github.com/micromark/micromark/tree/main/packages/micromark-factory-label>
// to allow empty labels, balanced brackets (such as for nested directives),
// text instead of strings, and optionally disallows EOLs.

export function factoryLabel(
  effects: Effects,
  ok: State,
  nok: State,
  type: TokenType,
  markerType: TokenType,
  stringType: TokenType,
  disallowEol?: boolean
): State {
  let size = 0
  let balance = 0
  let previous: Token | undefined

  return start

  function start(code: Code): State | undefined {
    assert(code === codes.leftSquareBracket, 'expected `[`')
    effects.enter(type)
    effects.enter(markerType)
    effects.consume(code)
    effects.exit(markerType)
    return afterStart
  }

  function afterStart(code: Code): State | undefined {
    if (code === codes.rightSquareBracket) {
      effects.enter(markerType)
      effects.consume(code)
      effects.exit(markerType)
      effects.exit(type)
      return ok
    }

    effects.enter(stringType)
    return lineStart(code)
  }

  function lineStart(code: Code): State | undefined {
    if (code === codes.rightSquareBracket && !balance) {
      return atClosingBrace(code)
    }

    const token = effects.enter(types.chunkText, {
      _contentTypeTextTrailing: true,
      contentType: constants.contentTypeText,
      previous
    })
    if (previous) previous.next = token
    previous = token
    return data(code)
  }

  function data(code: Code): State | undefined {
    if (code === codes.eof || size > constants.linkReferenceSizeMax) {
      return nok(code)
    }

    if (
      code === codes.leftSquareBracket &&
      ++balance > constants.linkResourceDestinationBalanceMax
    ) {
      return nok(code)
    }

    if (code === codes.rightSquareBracket && !balance--) {
      effects.exit(types.chunkText)
      return atClosingBrace(code)
    }

    if (markdownLineEnding(code)) {
      if (disallowEol) {
        return nok(code)
      }

      effects.consume(code)
      effects.exit(types.chunkText)
      return lineStart
    }

    effects.consume(code)
    return code === codes.backslash ? dataEscape : data
  }

  function dataEscape(code: Code): State | undefined {
    if (
      code === codes.leftSquareBracket ||
      code === codes.backslash ||
      code === codes.rightSquareBracket
    ) {
      effects.consume(code)
      size++
      return data
    }

    return data(code)
  }

  function atClosingBrace(code: Code): State | undefined {
    effects.exit(stringType)
    effects.enter(markerType)
    effects.consume(code)
    effects.exit(markerType)
    effects.exit(type)
    return ok
  }
}
