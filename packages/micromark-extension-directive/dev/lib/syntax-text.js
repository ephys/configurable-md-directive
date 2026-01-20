/**
 * @import {Extension} from 'micromark-util-types'
 */

import {codes} from 'micromark-util-symbol'
import {directiveText as directiveTextConstruct} from './directive-text.js'

/**
 * Create an extension for `micromark` to enable text directive syntax.
 *
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable text directive syntax.
 */
export function directiveText() {
  return {
    text: {[codes.colon]: directiveTextConstruct}
  }
}
