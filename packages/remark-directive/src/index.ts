import type {Root} from 'mdast'
import type {Processor} from 'unified'
import type {Extension as MicromarkExtension} from 'micromark-util-types'
import type {Extension as FromMarkdownExtension} from 'mdast-util-from-markdown'
import type {Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
import {directiveFromMarkdown, directiveToMarkdown} from 'mdast-util-directive'
import {
  directiveLeaf,
  directiveContainer,
  directiveText
} from '@ephys/micromark-extension-directive'

// Extend the unified Data interface to include our extension arrays
declare module 'unified' {
  interface Data {
    fromMarkdownExtensions?: FromMarkdownExtension[] | undefined
    micromarkExtensions?: MicromarkExtension[] | undefined
    toMarkdownExtensions?: ToMarkdownExtension[] | undefined
  }
}

/**
 * Add support for generic directives.
 *
 * ###### Notes
 *
 * Doesn't handle the directives: create your own plugin to do that.
 */
export function remarkDirective(this: Processor<Root>): void {
  const data = this.data()

  const micromarkExtensions = data.micromarkExtensions || []
  data.micromarkExtensions = micromarkExtensions

  const fromMarkdownExtensions = data.fromMarkdownExtensions || []
  data.fromMarkdownExtensions = fromMarkdownExtensions

  const toMarkdownExtensions = data.toMarkdownExtensions || []
  data.toMarkdownExtensions = toMarkdownExtensions

  micromarkExtensions.push(
    directiveLeaf(),
    directiveContainer(),
    directiveText()
  )

  fromMarkdownExtensions.push(directiveFromMarkdown())
  toMarkdownExtensions.push(directiveToMarkdown())
}
