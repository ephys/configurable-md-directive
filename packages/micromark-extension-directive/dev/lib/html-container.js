/**
 * @import {HtmlOptions} from '@ephys/micromark-extension-directive'
 * @import {HtmlExtension} from 'micromark-util-types'
 */

import {
  enter,
  enterAttributes,
  enterLabel,
  exitName,
  exitLabel,
  exitAttributeIdValue,
  exitAttributeClassValue,
  exitAttributeName,
  exitAttributeValue,
  exitAttributes,
  exitContainerContent,
  exitContainerFence,
  createExit
} from './html-shared.js'

/**
 * Create an extension for `micromark` to support container directives when
 * serializing to HTML.
 *
 * @param {HtmlOptions | undefined} [options={}]
 *   Configuration (default: `{}`).
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions`, to
 *   support container directives when serializing to HTML.
 */
export function directiveContainerHtml(options = {}) {
  const exit = createExit(options)

  return {
    enter: {
      directiveContainer() {
        enter.call(this, 'containerDirective')
      },
      directiveContainerAttributes: enterAttributes,
      directiveContainerLabel: enterLabel,
      directiveContainerContent() {
        this.buffer()
      }
    },
    exit: {
      directiveContainer: exit,
      directiveContainerAttributeClassValue: exitAttributeClassValue,
      directiveContainerAttributeIdValue: exitAttributeIdValue,
      directiveContainerAttributeName: exitAttributeName,
      directiveContainerAttributeValue: exitAttributeValue,
      directiveContainerAttributes: exitAttributes,
      directiveContainerContent: exitContainerContent,
      directiveContainerFence: exitContainerFence,
      directiveContainerLabel: exitLabel,
      directiveContainerName: exitName
    }
  }
}
