/**
 * @import {Extension} from 'micromark-util-types'
 */

import {codes} from 'micromark-util-symbol'
import {directiveLeaf as directiveLeafConstruct} from './directive-leaf.js'

/**
 * Create an extension for `micromark` to enable leaf directive syntax.
 *
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable leaf directive syntax.
 */
export function directiveLeaf() {
  return {
    flow: {[codes.colon]: [directiveLeafConstruct]}
  }
}
