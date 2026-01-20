import type {
  Code,
  Effects,
  State,
  TokenizeContext,
  TokenType
} from 'micromark-util-types'
import {
  markdownLineEnding,
  unicodePunctuation,
  unicodeWhitespace
} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol'

export function factoryName(
  context: TokenizeContext,
  effects: Effects,
  ok: State,
  nok: State,
  type: TokenType
): State {
  function start(code: Code): State | undefined {
    if (
      code === codes.eof ||
      markdownLineEnding(code) ||
      unicodePunctuation(code) ||
      unicodeWhitespace(code)
    ) {
      return nok(code)
    }

    effects.enter(type)
    effects.consume(code)
    return name
  }

  function name(code: Code): State | undefined {
    if (
      code === codes.eof ||
      markdownLineEnding(code) ||
      unicodeWhitespace(code) ||
      (unicodePunctuation(code) &&
        code !== codes.dash &&
        code !== codes.underscore)
    ) {
      effects.exit(type)
      return context.previous === codes.dash ||
        context.previous === codes.underscore
        ? nok(code)
        : ok(code)
    }

    effects.consume(code)
    return name
  }

  return start
}
