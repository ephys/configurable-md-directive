import type {Extension} from 'micromark-util-types'
import {codes} from 'micromark-util-symbol'
import {directiveContainer as directiveContainerConstruct} from './directive-container.js'

/**
 * Create an extension for `micromark` to enable container directive syntax.
 *
 * @returns
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable container directive syntax.
 */
export function directiveContainer(): Extension {
  return {
    flow: {[codes.colon]: [directiveContainerConstruct]}
  }
}
