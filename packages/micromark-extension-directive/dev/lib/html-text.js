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
 * Create an extension for `micromark` to support text directives when
 * serializing to HTML.
 *
 * @param {HtmlOptions | undefined} [options={}]
 *   Configuration (default: `{}`).
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions`, to
 *   support text directives when serializing to HTML.
 */
export function directiveTextHtml(options = {}) {
  const exit = createExit(options)

  return {
    enter: {
      directiveText() {
        enter.call(this, 'textDirective')
      },
      directiveTextAttributes: enterAttributes,
      directiveTextLabel: enterLabel
    },
    exit: {
      directiveText: exit,
      directiveTextAttributeClassValue: exitAttributeClassValue,
      directiveTextAttributeIdValue: exitAttributeIdValue,
      directiveTextAttributeName: exitAttributeName,
      directiveTextAttributeValue: exitAttributeValue,
      directiveTextAttributes: exitAttributes,
      directiveTextLabel: exitLabel,
      directiveTextName: exitName
    }
  }
}
