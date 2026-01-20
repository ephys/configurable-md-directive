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
  createExit
} from './html-shared.js'

/**
 * Create an extension for `micromark` to support leaf directives when
 * serializing to HTML.
 *
 * @param {HtmlOptions | undefined} [options={}]
 *   Configuration (default: `{}`).
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions`, to
 *   support leaf directives when serializing to HTML.
 */
export function directiveLeafHtml(options = {}) {
  const exit = createExit(options)

  return {
    enter: {
      directiveLeaf() {
        enter.call(this, 'leafDirective')
      },
      directiveLeafAttributes: enterAttributes,
      directiveLeafLabel: enterLabel
    },
    exit: {
      directiveLeaf: exit,
      directiveLeafAttributeClassValue: exitAttributeClassValue,
      directiveLeafAttributeIdValue: exitAttributeIdValue,
      directiveLeafAttributeName: exitAttributeName,
      directiveLeafAttributeValue: exitAttributeValue,
      directiveLeafAttributes: exitAttributes,
      directiveLeafLabel: exitLabel,
      directiveLeafName: exitName
    }
  }
}
