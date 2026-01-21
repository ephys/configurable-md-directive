import type {Root} from 'mdast'
import type {Processor} from 'unified'
import type {Extension as MicromarkExtension} from 'micromark-util-types'
import type {Extension as FromMarkdownExtension} from 'mdast-util-from-markdown'
import type {Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
// eslint-disable-next-line import/no-duplicates -- this one won't be included in the type output
import {directiveFromMarkdown, directiveToMarkdown} from 'mdast-util-directive'
import {
  directiveLeaf,
  directiveContainer,
  directiveText
} from '@ephys/micromark-extension-directive'
// eslint-disable-next-line import/no-duplicates -- we have to import this to augment the types, this one will be included in the type output
import 'mdast-util-directive'

// Extend the unified Data interface to include our extension arrays
declare module 'unified' {
  interface Data {
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined
    micromarkExtensions?: MicromarkExtension[] | undefined
    toMarkdownExtensions?: ToMarkdownExtension[] | undefined
  }
}

interface Options {
  /**
   * Types of directives to support.
   * @default ['text', 'leaf', 'container']
   */
  directiveTypes?: Array<'text' | 'leaf' | 'container'> | undefined
}

const DEFAULT_DIRECTIVE_TYPES: Array<'text' | 'leaf' | 'container'> = [
  'text',
  'leaf',
  'container'
]

/**
 * Add support for generic directives.
 *
 * ###### Notes
 *
 * Doesn't handle the directives: create your own plugin to do that.
 */
export function remarkDirective(this: void, options: Options | undefined) {
  return function builtRemarkDirectivePlugin(this: Processor<Root>): undefined {
    const data = this.data()

    const micromarkExtensions = data.micromarkExtensions || []
    data.micromarkExtensions = micromarkExtensions

    const fromMarkdownExtensions = data.fromMarkdownExtensions || []
    data.fromMarkdownExtensions = fromMarkdownExtensions

    const toMarkdownExtensions = data.toMarkdownExtensions || []
    data.toMarkdownExtensions = toMarkdownExtensions

    const directiveTypes = options?.directiveTypes ?? DEFAULT_DIRECTIVE_TYPES
    if (directiveTypes.includes('leaf')) {
      micromarkExtensions.push(directiveLeaf())
    }

    if (directiveTypes.includes('container')) {
      micromarkExtensions.push(directiveContainer())
    }

    if (directiveTypes.includes('text')) {
      micromarkExtensions.push(directiveText())
    }

    fromMarkdownExtensions.push(directiveFromMarkdown())
    toMarkdownExtensions.push(directiveToMarkdown())
  }
}
